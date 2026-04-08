// ============================================================
// Claude tweet classifier
// Sends tweets in batches to Claude Haiku and gets back structured
// classifications via tool_use (JSON schema enforced).
// ============================================================

import Anthropic from "@anthropic-ai/sdk";
import type { XTweet } from "./x-api";
import type { ClassifiedTweet, CategoryName, Severity } from "./diagnose-types";

const MODEL = "claude-haiku-4-5-20251001";
const BATCH_SIZE = 20;

const SYSTEM_PROMPT = `あなたは日本の刑法・民法に基づきSNS投稿のリスクを分類する法務アシスタントです。
各投稿について、以下のいずれかに分類し、重要度と根拠を返してください。

【カテゴリ】
- 名誉毀損 (刑法230条): 公然と事実を摘示し、人の社会的評価を低下させるもの
- 侮辱 (刑法231条): 事実の摘示なしに人を侮辱するもの
- 脅迫 (刑法222条): 生命・身体・自由・名誉・財産に対する害悪の告知
- プライバシー侵害 (民法709条): 私生活上の事実の暴露、個人情報の特定
- 該当なし: 上記いずれにも該当しない通常の投稿

【重要度】
- high: 明確に法的責任を問われる可能性が高い
- medium: 文脈次第で問題となりうる
- low: グレーゾーンだが法的リスクは低い
- none: リスクなし（カテゴリ「該当なし」と同義）

これは法的助言ではなく、ユーザーへのリスク提示用の参考情報です。
必ず classify_tweets ツールを使って結果を返してください。`;

interface ClassifyOutput {
  tweet_id: string;
  category: CategoryName | "該当なし";
  severity: Severity | "none";
  applicable_law: string;
  tags: string[];
  reasoning: string;
}

const TOOL = {
  name: "classify_tweets",
  description: "Classify a batch of tweets according to the Japanese legal categories.",
  input_schema: {
    type: "object" as const,
    properties: {
      results: {
        type: "array",
        items: {
          type: "object",
          properties: {
            tweet_id: { type: "string" },
            category: {
              type: "string",
              enum: ["名誉毀損", "侮辱", "脅迫", "プライバシー侵害", "該当なし"],
            },
            severity: { type: "string", enum: ["high", "medium", "low", "none"] },
            applicable_law: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            reasoning: { type: "string" },
          },
          required: ["tweet_id", "category", "severity", "applicable_law", "tags", "reasoning"],
        },
      },
    },
    required: ["results"],
  },
};

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function classifyBatch(client: Anthropic, batch: XTweet[]): Promise<ClassifyOutput[]> {
  const userMessage =
    `次の${batch.length}件の投稿を分類してください。\n\n` +
    batch
      .map((t, i) => `[${i + 1}] tweet_id: ${t.id}\n${t.text.replace(/\s+/g, " ").trim()}`)
      .join("\n\n");

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [TOOL],
    tool_choice: { type: "tool", name: "classify_tweets" },
    messages: [{ role: "user", content: userMessage }],
  });

  const toolUse = res.content.find((c) => c.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return a tool_use response");
  }
  const input = toolUse.input as { results: ClassifyOutput[] };
  return input.results ?? [];
}

/**
 * Classify all tweets, batched for efficiency.
 * Returns one ClassifiedTweet per input tweet (in input order, best-effort).
 */
export async function classifyTweets(tweets: XTweet[]): Promise<ClassifiedTweet[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey });
  const batches = chunk(tweets, BATCH_SIZE);

  // Process batches in parallel (Claude rate limits are generous for Haiku)
  const results = await Promise.all(batches.map((b) => classifyBatch(client, b)));
  const flat = results.flat();

  // Map back to ClassifiedTweet (joined with original tweet metadata)
  const byId = new Map(flat.map((r) => [r.tweet_id, r]));
  return tweets.map((t) => {
    const c = byId.get(t.id);
    return {
      tweet_id: t.id,
      text: t.text,
      created_at: t.created_at,
      category: c?.category ?? "該当なし",
      severity: c?.severity ?? "none",
      applicable_law: c?.applicable_law ?? "",
      tags: c?.tags ?? [],
      reasoning: c?.reasoning ?? "",
      metrics: {
        likes: t.public_metrics.like_count,
        rt: t.public_metrics.retweet_count,
        reply: t.public_metrics.reply_count,
      },
    };
  });
}

export function isClaudeConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
