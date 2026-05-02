// ============================================================
// Diagnosis orchestrator — combines X API + Claude + scoring
// Falls back to mock data when keys are missing or USE_MOCK=true.
// ============================================================

import {
  getRecentTweetsWithIncludes,
  getUserByUsername,
  isXConfigured,
} from "./x-api";
import { classifyTweets, generateSummary, isClaudeConfigured } from "./classify-tweets";
import { buildDiagnosis } from "./score";
import { generateMockDiagnosis } from "./mock-diagnosis";
import { getCached, setCached } from "./cache";
import type { DiagnosisData } from "./diagnose-types";

export interface DiagnoseOptions {
  /** Skip cache (force fresh fetch) */
  noCache?: boolean;
  /** Force mock mode regardless of env (dev/preview only) */
  forceMock?: boolean;
}

/**
 * Mock は本番環境では絶対に使わない。
 *   - NODE_ENV=production かつ X+Claude の env が揃っていれば実 API
 *   - NODE_ENV=production かつ env 不足なら diagnose() が例外を投げる
 *   - それ以外 (開発/プレビュー) で env 不足 or USE_MOCK=true or forceMock なら mock
 */
function shouldUseMock(forceMock?: boolean): boolean {
  // forceMock is honoured everywhere — it lets admins preview the UI in
  // production without consuming X / Claude credits. Mock responses skip
  // recordLead and don't write to the cache, so they don't pollute analytics.
  if (forceMock) return true;
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.USE_MOCK === "true") return true;
  if (!isXConfigured() || !isClaudeConfigured()) return true;
  return false;
}

/** Thrown when we would need mock data but are running in production. */
export class DiagnoseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DiagnoseConfigError";
  }
}

export async function diagnose(
  username: string,
  opts: DiagnoseOptions = {},
): Promise<DiagnosisData> {
  const cleaned = username.replace(/^@/, "").trim();
  if (!cleaned) throw new Error("username is required");

  // Mock mode short-circuit (dev/preview only)
  if (shouldUseMock(opts.forceMock)) {
    return generateMockDiagnosis(cleaned);
  }

  // Production: demand real credentials
  if (!isXConfigured() || !isClaudeConfigured()) {
    throw new DiagnoseConfigError(
      "診断サービスが利用できません。管理者に連絡してください。",
    );
  }

  // Cache hit
  if (!opts.noCache) {
    const hit = await getCached(cleaned);
    if (hit) return hit;
  }

  // Fresh analysis. Pinned tweet comes back inline via `expansions=pinned_tweet_id`
  // on the user lookup, so this is still just two billable X API calls
  // (user lookup + timeline) — same as before.
  const { user, pinnedTweet } = await getUserByUsername(cleaned);
  const { tweets, mediaByKey, referencedById, usersById } =
    await getRecentTweetsWithIncludes(user.id, 100);

  if (tweets.length === 0) {
    // Empty timeline → return a low-risk diagnosis
    const empty = buildDiagnosis(user, [], [], { pinnedTweet });
    await setCached(cleaned, empty);
    return empty;
  }

  const classified = await classifyTweets(tweets, { referencedById });
  const data = buildDiagnosis(user, tweets, classified, {
    mediaByKey,
    referencedById,
    usersById,
    pinnedTweet,
  });

  // Generate AI summary in parallel-friendly fashion (best effort)
  try {
    data.aiSummary = await generateSummary(cleaned, classified);
  } catch (err) {
    console.warn("[diagnose] aiSummary generation failed:", err);
  }

  await setCached(cleaned, data);
  return data;
}
