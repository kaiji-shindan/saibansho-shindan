// ============================================================
// Diagnosis orchestrator — combines X API + Claude + scoring
// Falls back to mock data when keys are missing or USE_MOCK=true.
// ============================================================

import { getRecentTweets, getUserByUsername, isXConfigured } from "./x-api";
import { classifyTweets, isClaudeConfigured } from "./classify-tweets";
import { buildDiagnosis } from "./score";
import { generateMockDiagnosis } from "./mock-diagnosis";
import { getCached, setCached } from "./cache";
import type { DiagnosisData } from "./diagnose-types";

export interface DiagnoseOptions {
  /** Skip cache (force fresh fetch) */
  noCache?: boolean;
  /** Force mock mode regardless of env */
  forceMock?: boolean;
}

function shouldUseMock(forceMock?: boolean): boolean {
  if (forceMock) return true;
  if (process.env.USE_MOCK === "true") return true;
  if (!isXConfigured() || !isClaudeConfigured()) return true;
  return false;
}

export async function diagnose(
  username: string,
  opts: DiagnoseOptions = {},
): Promise<DiagnosisData> {
  const cleaned = username.replace(/^@/, "").trim();
  if (!cleaned) throw new Error("username is required");

  // Mock mode short-circuit
  if (shouldUseMock(opts.forceMock)) {
    return generateMockDiagnosis(cleaned);
  }

  // Cache hit
  if (!opts.noCache) {
    const hit = await getCached(cleaned);
    if (hit) return hit;
  }

  // Fresh analysis
  const user = await getUserByUsername(cleaned);
  const tweets = await getRecentTweets(user.id, 100);
  if (tweets.length === 0) {
    // Empty timeline → return a low-risk diagnosis
    const empty = buildDiagnosis(user, [], []);
    await setCached(cleaned, empty);
    return empty;
  }

  const classified = await classifyTweets(tweets);
  const data = buildDiagnosis(user, tweets, classified);
  await setCached(cleaned, data);
  return data;
}
