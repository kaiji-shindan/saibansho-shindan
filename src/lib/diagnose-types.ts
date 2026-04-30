// ============================================================
// Shared types — server (API route) ↔ client (DiagnoseClient)
//
// 方針: ここで定義する全フィールドは X API Basic tier + Claude で
// 実際に取得できるものに限定する。取得できない定性的情報 (発信トーン、
// サブジャンル、エンゲージメント安定度、フォロワー増減 等) は型に含めない。
// ============================================================

export type Level = "S" | "A" | "B" | "C" | "D" | "E";
export type Severity = "high" | "medium" | "low";

export type CategoryName =
  | "名誉毀損"
  | "侮辱"
  | "脅迫"
  | "プライバシー侵害";

/** Five-axis emotion profile (0-100) */
export interface EmotionProfile {
  anger: number;     // 怒り
  contempt: number;  // 侮蔑
  mockery: number;   // 嘲笑
  threat: number;    // 脅威
  sadness: number;   // 悲哀
}

export type DominantEmotion = keyof EmotionProfile;

/** X /2/users/:id/verified_type の値 */
export type VerifiedType = "none" | "blue" | "business" | "government";

export interface ClassifiedTweet {
  tweet_id: string;
  text: string;
  created_at: string; // ISO
  category: CategoryName | "該当なし";
  severity: Severity | "none";
  applicable_law: string; // e.g. "刑法230条"
  tags: string[];
  reasoning: string;
  metrics: { likes: number; rt: number; reply: number };
  /** Dominant emotion of this tweet (premium) */
  emotion?: DominantEmotion;
  /** SHA-256 of `${tweet_id}|${created_at}|${text}` for tamper-evidence */
  hash?: string;
  /** ISO timestamp when this evidence was captured by the system */
  capturedAt?: string;
}

// ============================================================
// Profile data — X API /users/:id から直接取れる公開情報のみ
// ============================================================
export interface ProfileData {
  username: string;
  displayName: string;
  bio: string;
  profileImageUrl?: string;
  url?: string;
  isVerified: boolean;
  verifiedType: VerifiedType;
  accountCreated: string;     // 表示用にフォーマット済み
  accountCreatedIso: string;  // ISO
  /** public_metrics.followers_count */
  followers: number;
  /** public_metrics.following_count */
  following: number;
  /** public_metrics.tweet_count (アカウント全体の総投稿数) */
  totalTweets: number;
  /** public_metrics.listed_count */
  listed: number;
}

// ============================================================
// Analysis data — 実ツイート群から算出する客観指標のみ
// ============================================================
export interface TweetComposition {
  /** オリジナル投稿 (返信でも引用でもないもの) */
  original: number;
  /** リプライ (in_reply_to_user_id あり) */
  reply: number;
  /** 引用 (referenced_tweets[].type === 'quoted') */
  quoted: number;
}

export interface MediaComposition {
  /** テキストのみ (メディアもリンクも無し) */
  textOnly: number;
  /** 画像/動画添付あり (attachments.media_keys.length > 0) */
  withMedia: number;
  /** 外部リンクあり (entities.urls のうち expanded_url が x.com/t.co 以外) */
  withLink: number;
}

export interface AnalysisData {
  /** 分析対象とした投稿数 (RT 除く) */
  analyzedPosts: number;
  /** 対象投稿の最古〜最新までの日数 */
  analyzedDays: number;
  /** 1日あたりの投稿数 (analyzedPosts / analyzedDays) */
  postsPerDay: number;
  /** 最も投稿の多い時間帯 (JST, 0-23) */
  peakHour: number;
  /** 時間帯別分布 (0-23時の 24 スロット) */
  hourlyCounts: number[];
  /** 投稿構成 */
  composition: TweetComposition;
  /** メディア構成 */
  media: MediaComposition;
  /** 最頻出の言語 (BCP-47 tag, 例: "ja", "en") */
  topLanguage: string;
  /** 言語分布 (top 5) */
  languages: { lang: string; count: number }[];
}

// ============================================================
// 診断結果全体
// ============================================================
export interface DiagnosisData {
  username: string;
  level: Level;
  score: number;
  totalPosts: number;      // 今回取得したツイートの数 (最大 100)
  problemPosts: number;
  categories: { name: CategoryName; count: number }[];
  topPosts: {
    text: string;
    category: string;
    severity: Severity;
    date: string;
  }[];
  replyRatio: number;
  mentionedUsers: { handle: string; count: number }[];
  hostileKeywords: { word: string; count: number }[];
  monthlyProblemPosts: { month: string; count: number }[];

  /** プロフィール実データ (X API user フィールドから) */
  profile: ProfileData;
  /** ツイート群から算出した客観指標 */
  analysis: AnalysisData;

  /** Full evidence list — every classified tweet with severity/category/law.
   *  Used by the premium (post-payment) view. */
  evidence: ClassifiedTweet[];
  /** Premium: Claude-generated narrative summary of the entire account */
  aiSummary?: string;
  /** Premium: aggregated emotion profile across all problem tweets */
  emotionProfile?: EmotionProfile;
  /** Premium: 7×24 grid of post counts (rows=days [Sun..Sat], cols=hours) */
  timeHeatmap?: number[][];
  /** "x-api+claude" | "mock" — for the UI to show data source */
  source: "x-api+claude" | "mock";
  /** ISO timestamp of analysis */
  analyzedAt: string;
}

export interface DiagnosisResponse {
  ok: boolean;
  data?: DiagnosisData;
  error?: string;
}
