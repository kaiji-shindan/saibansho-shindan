// ============================================================
// Mock diagnosis generator
//
// 実 API キーが未設定 or USE_MOCK=true の時に使われる。
// 方針:
//   架空の数字だが、すべて X API Basic tier + Claude で実際に
//   取得できる形のデータに限定する。実装後の UI と構造が一致する
//   ようにする (実装と mock のスキーマは同一)。
// ============================================================

import { createHash } from "crypto";
import type {
  AnalysisData,
  CategoryName,
  ClassifiedTweet,
  DiagnosisData,
  Level,
  ProfileData,
} from "./diagnose-types";

function mockHash(seed: string): string {
  return createHash("sha256").update(seed).digest("hex");
}

function buildMockHeatmap(seed: number): number[][] {
  // Concentrate activity on weekday evenings + late nights for realism
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      let base = 0;
      if (hour >= 22 || hour < 2) base = 5; // late night spike
      else if (hour >= 19 && hour < 22) base = 3;
      else if (hour >= 12 && hour < 14) base = 2;
      else if (hour >= 6 && hour < 9) base = 1;
      const noise = ((seed * (day + 1) * (hour + 1)) % 4);
      grid[day][hour] = Math.max(0, base + noise - 1);
    }
  }
  return grid;
}

function buildMockProfile(username: string, seed: number): ProfileData {
  const created = new Date(2020 + (seed % 5), (seed % 12), 1 + (seed % 27));
  return {
    username,
    displayName: `${username.charAt(0).toUpperCase()}${username.slice(1)}`,
    bio: "※ サンプル表示です。実環境では X API から実際の自己紹介文を取得します。",
    profileImageUrl: undefined,
    url: undefined,
    isVerified: false, // mock は常に false。実 API 接続時に verified_type で判定
    verifiedType: "none",
    accountCreated: created.toLocaleDateString("ja-JP"),
    accountCreatedIso: created.toISOString(),
    followers: Math.max(120, (seed * 347) % 48000),
    following: Math.max(50, (seed * 123) % 2400),
    totalTweets: Math.max(200, (seed * 231) % 38000),
    listed: Math.max(1, (seed * 43) % 480),
    isProtected: false,
    bioEntities: {
      urls: [],
      hashtags: [],
      mentions: [],
    },
    pinnedTweet: {
      id: "mock_pinned",
      text: "新規フォロワーさん、はじめまして。よろしくお願いします。",
      createdAt: "2026-01-12T08:00:00.000Z",
      likes: 42,
      rt: 5,
      reply: 3,
      quote: 1,
      isLongForm: false,
    },
  };
}

function buildMockAnalysis(seed: number, analyzedPosts: number): AnalysisData {
  // 投稿頻度 (1日あたり)
  const postsPerDay = parseFloat((1 + (seed % 8) + (seed % 10) / 10).toFixed(1));
  const analyzedDays = Math.max(7, Math.round(analyzedPosts / Math.max(0.5, postsPerDay)));

  // 時間帯分布 (JST 0-23)
  const hourlyCounts: number[] = Array(24).fill(0);
  const totalHours = analyzedPosts;
  // Same realistic late-night skew as the heatmap
  const weights = [3, 2, 1, 1, 1, 1, 2, 3, 3, 3, 3, 4, 5, 4, 3, 3, 4, 5, 6, 7, 7, 8, 9, 6];
  const weightSum = weights.reduce((a, b) => a + b, 0);
  for (let h = 0; h < 24; h++) {
    hourlyCounts[h] = Math.round((weights[h] / weightSum) * totalHours);
  }
  const peakHour = hourlyCounts.indexOf(Math.max(...hourlyCounts));

  // 投稿構成
  const originalPct = 0.45 + (seed % 10) / 100;
  const replyPct = 0.35 - (seed % 8) / 100;
  const quotedPct = 1 - originalPct - replyPct;
  const composition = {
    original: Math.round(analyzedPosts * originalPct),
    reply: Math.round(analyzedPosts * replyPct),
    quoted: Math.max(0, Math.round(analyzedPosts * quotedPct)),
  };

  // メディア構成
  const mediaPct = 0.18 + (seed % 12) / 100;
  const linkPct = 0.12 + (seed % 8) / 100;
  const media = {
    withMedia: Math.round(analyzedPosts * mediaPct),
    withLink: Math.round(analyzedPosts * linkPct),
    textOnly: analyzedPosts - Math.round(analyzedPosts * mediaPct) - Math.round(analyzedPosts * linkPct),
  };

  return {
    analyzedPosts,
    analyzedDays,
    postsPerDay,
    peakHour,
    hourlyCounts,
    composition,
    media,
    topLanguage: "ja",
    languages: [
      { lang: "ja", count: Math.round(analyzedPosts * 0.92) },
      { lang: "en", count: Math.round(analyzedPosts * 0.06) },
      { lang: "und", count: Math.round(analyzedPosts * 0.02) },
    ],
  };
}

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

  // X API Basic tier は max_results=100 が上限。mock でもこれを厳守する。
  const totalPosts = Math.min(100, Math.max(50, 50 + (seed * 13) % 50));
  const problemPosts = Math.min(totalPosts, Math.max(3, (seed * 7) % Math.max(4, Math.floor(totalPosts / 3))));

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
    profile: buildMockProfile(username, seed),
    analysis: buildMockAnalysis(seed, totalPosts),
    evidence: ([
      {
        tweet_id: "mock_001",
        text: "◯◯は本当に最低なクズ野郎で、こういう人間は社会から消えるべきだと思う。家族ごと不幸になればいい。前科もあるって聞いたし。",
        created_at: "2026-03-28T23:14:00.000Z",
        category: "名誉毀損",
        severity: "high",
        applicable_law: "刑法230条",
        tags: ["事実摘示", "公然性あり"],
        reasoning: "氏名を特定可能な状態で虚偽の事実を摘示しており、公然と社会的評価を低下させている。",
        emotion: "anger",
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
        emotion: "threat",
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
        emotion: "contempt",
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
        emotion: "contempt",
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
        emotion: "mockery",
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
        emotion: "mockery",
        metrics: { likes: 6, rt: 0, reply: 1 },
      },
    ] as ClassifiedTweet[]).map((e) => ({
      ...e,
      hash: mockHash(`${e.tweet_id}|${e.created_at}|${e.text}`),
      capturedAt: "2026-04-09T00:00:00.000Z",
    })),
    aiSummary:
      `@${username} の投稿群には、特定の個人を執拗に攻撃する表現が複数見られる傾向がある。` +
      "深夜帯（22時〜2時）に問題投稿が集中しており、感情の高ぶりやすい時間帯にネガティブな発信を行うパターンが観察された。" +
      "怒り・侮蔑・嘲笑といった攻撃的感情が支配的で、対象の氏名・所属を匂わせる投稿も含まれる点に注意を要すると見られる。" +
      "ただし最終的な法的判断は、必ず弁護士の確認が必要である。",
    emotionProfile: { anger: 38, contempt: 28, mockery: 22, threat: 8, sadness: 4 },
    timeHeatmap: buildMockHeatmap(seed),
    source: "mock",
    analyzedAt: new Date().toISOString(),
  };
}
