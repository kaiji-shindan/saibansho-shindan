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
    evidence: [
      {
        tweet_id: "mock_001",
        text: "◯◯は本当に最低なクズ野郎で、こういう人間は社会から消えるべきだと思う。家族ごと不幸になればいい。前科もあるって聞いたし。",
        created_at: "2026-03-28T23:14:00.000Z",
        category: "名誉毀損",
        severity: "high",
        applicable_law: "刑法230条",
        tags: ["事実摘示", "公然性あり"],
        reasoning: "氏名を特定可能な状態で虚偽の事実を摘示しており、公然と社会的評価を低下させている。",
        metrics: { likes: 47, rt: 12, reply: 8 },
      },
      {
        tweet_id: "mock_002",
        text: "次会ったら絶対に殴る。覚悟しとけよ。住所も知ってるからな。",
        created_at: "2026-03-25T02:41:00.000Z",
        category: "脅迫",
        severity: "high",
        applicable_law: "刑法222条",
        tags: ["害悪の告知", "特定人物宛"],
        reasoning: "身体への害悪を明確に告知しており、相手を威迫する内容。",
        metrics: { likes: 8, rt: 1, reply: 3 },
      },
      {
        tweet_id: "mock_003",
        text: "◯◯のツラ見るたびに虫唾が走るんだよな、ほんとブスだし喋り方もキモい。生理的に無理。",
        created_at: "2026-03-19T18:42:00.000Z",
        category: "侮辱",
        severity: "medium",
        applicable_law: "刑法231条",
        tags: ["公然性あり", "対象特定可能"],
        reasoning: "事実摘示なく侮辱的表現を公然と発信。",
        metrics: { likes: 23, rt: 5, reply: 4 },
      },
      {
        tweet_id: "mock_004",
        text: "◯◯の本名△△で、△△大学の3年生らしいよ。インスタは @xxxxx だって。",
        created_at: "2026-03-15T12:08:00.000Z",
        category: "プライバシー侵害",
        severity: "high",
        applicable_law: "民法709条",
        tags: ["私事の暴露", "氏名特定"],
        reasoning: "本人の同意なく氏名・所属・他SNSアカウントを暴露。",
        metrics: { likes: 31, rt: 9, reply: 6 },
      },
      {
        tweet_id: "mock_005",
        text: "◯◯ってあの会社で横領して辞めさせられたって本当？信じられないわ。",
        created_at: "2026-03-10T21:30:00.000Z",
        category: "名誉毀損",
        severity: "medium",
        applicable_law: "刑法230条",
        tags: ["虚偽の事実", "業務妨害の疑い"],
        reasoning: "虚偽の事実を疑問形で広めており、社会的評価の低下につながる。",
        metrics: { likes: 19, rt: 4, reply: 2 },
      },
      {
        tweet_id: "mock_006",
        text: "馬鹿すぎて話にならない。生きてる価値あるの？",
        created_at: "2026-03-05T09:14:00.000Z",
        category: "侮辱",
        severity: "low",
        applicable_law: "刑法231条",
        tags: ["対象特定", "公然性あり"],
        reasoning: "侮辱的表現だが軽度。文脈次第では侮辱罪該当の可能性。",
        metrics: { likes: 6, rt: 0, reply: 1 },
      },
    ],
    source: "mock",
    analyzedAt: new Date().toISOString(),
  };
}
