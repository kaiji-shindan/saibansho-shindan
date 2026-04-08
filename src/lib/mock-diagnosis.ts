// ============================================================
// Mock diagnosis generator — used when X/Claude keys are absent
// or USE_MOCK=true. Same shape as real DiagnosisData.
// ============================================================

import type { DiagnosisData, Level, CategoryName } from "./diagnose-types";

export function generateMockDiagnosis(username: string): DiagnosisData {
  const seed = username.length + username.charCodeAt(0);
  const score = Math.min(95, Math.max(12, (seed * 17 + 23) % 100));

  let level: Level;
  if (score >= 85) level = "S";
  else if (score >= 70) level = "A";
  else if (score >= 55) level = "B";
  else if (score >= 40) level = "C";
  else if (score >= 25) level = "D";
  else level = "E";

  const problemPosts = Math.max(3, (seed * 7) % 45);
  const totalPosts = problemPosts + Math.max(50, (seed * 13) % 500);

  const categories: { name: CategoryName; count: number }[] = [
    { name: "名誉毀損", count: Math.max(1, Math.floor(problemPosts * 0.35)) },
    { name: "侮辱", count: Math.max(1, Math.floor(problemPosts * 0.3)) },
    { name: "脅迫", count: Math.max(0, Math.floor(problemPosts * 0.15)) },
    { name: "プライバシー侵害", count: Math.max(0, Math.floor(problemPosts * 0.2)) },
  ];

  return {
    username,
    level,
    score,
    totalPosts,
    problemPosts,
    categories,
    topPosts: [
      { text: "こいつマジで○ねよ。存在価値ないわ。", category: "脅迫", severity: "high", date: "2026/03/15" },
      { text: "あの人って前科あるらしいよ（嘘の情報を流布）", category: "名誉毀損", severity: "high", date: "2026/03/10" },
      { text: "ブスすぎて草。こんな顔で外歩くなよ", category: "侮辱", severity: "medium", date: "2026/02/28" },
    ],
    accountCreated: `${2020 + (seed % 5)}/0${1 + (seed % 9)}/15`,
    replyRatio: parseFloat((40 + (seed % 35)).toFixed(1)),
    mentionedUsers: [
      { handle: "user_a", count: Math.max(3, (seed * 4) % 25) },
      { handle: "user_b", count: Math.max(2, (seed * 3) % 15) },
      { handle: "user_c", count: Math.max(1, (seed * 2) % 8) },
    ],
    hostileKeywords: [
      { word: "○ね", count: Math.max(2, (seed * 3) % 12) },
      { word: "キモい", count: Math.max(1, (seed * 2) % 8) },
      { word: "消えろ", count: Math.max(1, (seed * 4) % 6) },
      { word: "ゴミ", count: Math.max(1, seed % 5) },
    ],
    monthlyProblemPosts: [
      { month: "1月", count: Math.max(1, Math.floor(problemPosts * 0.2)) },
      { month: "2月", count: Math.max(2, Math.floor(problemPosts * 0.3)) },
      { month: "3月", count: Math.max(3, Math.floor(problemPosts * 0.5)) },
    ],
    source: "mock",
    analyzedAt: new Date().toISOString(),
  };
}
