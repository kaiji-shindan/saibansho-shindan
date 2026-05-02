// ============================================================
// Claude tweet classifier
// Sends tweets in batches to Claude Haiku and gets back structured
// classifications via tool_use (JSON schema enforced).
// ============================================================

import Anthropic from "@anthropic-ai/sdk";
import type { XTweet, XReferencedTweet } from "./x-api";
import type { ClassifiedTweet, CategoryName, Severity, DominantEmotion } from "./diagnose-types";

export interface ClassifyContext {
  /** Map of tweet id → referenced tweet content (reply parent / quoted tweet). */
  referencedById?: Map<string, XReferencedTweet>;
}

/** Resolve the canonical body text for a tweet, preferring note_tweet (>280 chars). */
function bodyOf(t: XTweet): string {
  return (t.note_tweet?.text ?? t.text).replace(/\s+/g, " ").trim();
}

/** Build the prompt block for a single tweet, optionally with reference context. */
function tweetBlock(t: XTweet, idx: number, ctx?: ClassifyContext): string {
  const body = bodyOf(t);
  let block = `[${idx}] tweet_id: ${t.id}\n${body}`;
  const refRel = t.referenced_tweets?.find(
    (r) => r.type === "replied_to" || r.type === "quoted",
  );
  if (refRel && ctx?.referencedById) {
    const ref = ctx.referencedById.get(refRel.id);
    if (ref) {
      const refText = (ref.note_tweet?.text ?? ref.text).replace(/\s+/g, " ").trim().slice(0, 220);
      const label = refRel.type === "replied_to" ? "返信先" : "引用元";
      block += `\n[${label}: ${refText}]`;
    }
  }
  return block;
}

const MODEL = "claude-haiku-4-5-20251001";
const BATCH_SIZE = 20;
const EMOTIONS: DominantEmotion[] = ["anger", "contempt", "mockery", "threat", "sadness"];

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

【厳守事項】
- 与えられた投稿本文 (text) のみを根拠とすること。本文に書かれていない事実・背景・過去の投稿・人物属性・被害者性・動機・心理状態を推測・補完しない。
- 文意が曖昧な場合は severity を下げる (high → medium、medium → low)。
- tweet_id と text 以外の外部情報を利用しない (ハルシネーション禁止)。

これは法的助言ではなく、ユーザーへのリスク提示用の参考情報です。
必ず classify_tweets ツールを使って結果を返してください。`;

interface ClassifyOutput {
  tweet_id: string;
  category: CategoryName | "該当なし";
  severity: Severity | "none";
  applicable_law: string;
  tags: string[];
  reasoning: string;
  emotion: DominantEmotion;
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
            emotion: {
              type: "string",
              enum: EMOTIONS,
              description: "投稿全体の支配的な感情。anger=怒り, contempt=侮蔑, mockery=嘲笑, threat=脅威, sadness=悲哀",
            },
          },
          required: ["tweet_id", "category", "severity", "applicable_law", "tags", "reasoning", "emotion"],
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

async function classifyBatch(
  client: Anthropic,
  batch: XTweet[],
  ctx?: ClassifyContext,
): Promise<ClassifyOutput[]> {
  const userMessage =
    `次の${batch.length}件の投稿を分類してください。\n` +
    `※ 角括弧 [返信先: …] [引用元: …] は文脈情報であり、分類対象は本文のみです。\n\n` +
    batch.map((t, i) => tweetBlock(t, i + 1, ctx)).join("\n\n");

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
export async function classifyTweets(
  tweets: XTweet[],
  ctx?: ClassifyContext,
): Promise<ClassifiedTweet[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey });
  const batches = chunk(tweets, BATCH_SIZE);

  // Process batches in parallel (Claude rate limits are generous for Haiku)
  const results = await Promise.all(batches.map((b) => classifyBatch(client, b, ctx)));
  const flat = results.flat();

  // Map back to ClassifiedTweet (joined with original tweet metadata)
  const byId = new Map(flat.map((r) => [r.tweet_id, r]));
  return tweets.map((t) => {
    const c = byId.get(t.id);
    // Use the long-form body (>280 chars) when present so the UI shows the full
    // text. score.enrichClassified will overwrite metrics anyway, but we still
    // populate them here so the function works standalone (e.g. tests).
    const canonicalText = t.note_tweet?.text ?? t.text;
    return {
      tweet_id: t.id,
      text: canonicalText,
      created_at: t.created_at,
      category: c?.category ?? "該当なし",
      severity: c?.severity ?? "none",
      applicable_law: c?.applicable_law ?? "",
      tags: c?.tags ?? [],
      reasoning: c?.reasoning ?? "",
      emotion: c?.emotion,
      metrics: {
        likes: t.public_metrics.like_count,
        rt: t.public_metrics.retweet_count,
        reply: t.public_metrics.reply_count,
        impressions: t.public_metrics.impression_count,
        bookmarks: t.public_metrics.bookmark_count,
      },
    };
  });
}

/**
 * Generate a narrative summary of the entire account based on classified tweets.
 * Returns ~200 chars of plain Japanese text.
 */
export async function generateSummary(
  username: string,
  classified: ClassifiedTweet[],
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey });
  const problem = classified.filter((c) => c.severity !== "none");
  const sample = problem
    .slice(0, 30)
    .map((c) => `[${c.category}/${c.severity}] ${c.text.replace(/\s+/g, " ").trim()}`)
    .join("\n");

  const stats = {
    total: classified.length,
    high: problem.filter((c) => c.severity === "high").length,
    medium: problem.filter((c) => c.severity === "medium").length,
    low: problem.filter((c) => c.severity === "low").length,
  };

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 500,
    system:
      "あなたは日本のSNS分析レポートを書くアナリストです。投稿傾向の総評を200〜250字の日本語で簡潔にまとめてください。"
      + "以下を厳守: "
      + "(1) 与えられたサンプル本文にない事実・背景・人物属性・被害者性・動機・心理状態を推測しない。"
      + "(2) 断定表現を避け、必ず「〜と見られる」「〜の傾向がある」「〜と観察される」等のヘッジ表現を使う。"
      + "(3) 法的判断を下さない。「違法」「犯罪」等の断定語を使わない。"
      + "(4) サンプルが少ない場合や判定が難しい場合はその旨を明記する。",
    messages: [
      {
        role: "user",
        content: `アカウント: @${username}\n統計: 分析${stats.total}件 / 重要度高${stats.high} 中${stats.medium} 低${stats.low}\n\n問題投稿サンプル:\n${sample || "（問題投稿なし）"}\n\n上記を踏まえて、このアカウントの投稿傾向を200〜250字で総評してください。`,
      },
    ],
  });

  const textBlock = res.content.find((c) => c.type === "text");
  return textBlock && textBlock.type === "text" ? textBlock.text.trim() : "";
}

export function isClaudeConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
