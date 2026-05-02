// ============================================================
// 診断ビルダー
//
// 方針: X API + Claude で「確実に取得できる」データだけを使う。
// 定性的な主観分類 (発信トーン / ジャンル / 安定度 等) は行わない。
// ============================================================

import { createHash } from "crypto";
import type {
  XTweet,
  XUser,
  XMedia,
  XReferencedTweet,
  VerifiedType,
} from "./x-api";
import type {
  ClassifiedTweet,
  DiagnosisData,
  Level,
  CategoryName,
  EmotionProfile,
  ProfileData,
  AnalysisData,
  TweetComposition,
  MediaComposition,
} from "./diagnose-types";

const SEVERITY_WEIGHT: Record<string, number> = {
  high: 10,
  medium: 5,
  low: 2,
  none: 0,
};

function levelFromScore(score: number): Level {
  if (score >= 85) return "S";
  if (score >= 70) return "A";
  if (score >= 55) return "B";
  if (score >= 40) return "C";
  if (score >= 25) return "D";
  return "E";
}

const HOSTILE_KEYWORDS = [
  "死ね",
  "○ね",
  "キモい",
  "消えろ",
  "ゴミ",
  "ブス",
  "クズ",
  "馬鹿",
  "うざい",
  "クソ",
];

// ============================================================
// Profile: X API の user オブジェクトをそのまま UI 用に整形
// ============================================================
export function buildProfile(
  user: XUser,
  pinnedTweet?: XReferencedTweet | null,
): ProfileData {
  const metrics = user.public_metrics ?? {
    followers_count: 0,
    following_count: 0,
    tweet_count: 0,
    listed_count: 0,
  };

  const vt: VerifiedType = user.verified_type ?? (user.verified ? "blue" : "none");

  const bioEntities: ProfileData["bioEntities"] = {
    urls: (user.entities?.description?.urls ?? []).map((u) => ({
      url: u.url,
      expandedUrl: u.expanded_url ?? u.url,
      displayUrl: u.display_url ?? u.url,
    })),
    hashtags: (user.entities?.description?.hashtags ?? []).map((h) => h.tag),
    mentions: (user.entities?.description?.mentions ?? []).map((m) => m.username),
  };

  let pinned: ProfileData["pinnedTweet"] | undefined;
  if (pinnedTweet) {
    const pm = pinnedTweet.public_metrics;
    pinned = {
      id: pinnedTweet.id,
      text: pinnedTweet.note_tweet?.text ?? pinnedTweet.text,
      createdAt: pinnedTweet.created_at,
      likes: pm?.like_count ?? 0,
      rt: pm?.retweet_count ?? 0,
      reply: pm?.reply_count ?? 0,
      quote: pm?.quote_count ?? 0,
      isLongForm: Boolean(pinnedTweet.note_tweet),
    };
  }

  return {
    username: user.username,
    displayName: user.name,
    bio: user.description ?? "",
    profileImageUrl: user.profile_image_url,
    url: user.url,
    isVerified: vt !== "none",
    verifiedType: vt,
    accountCreated: new Date(user.created_at).toLocaleDateString("ja-JP"),
    accountCreatedIso: user.created_at,
    followers: metrics.followers_count,
    following: metrics.following_count,
    totalTweets: metrics.tweet_count,
    listed: metrics.listed_count,
    isProtected: Boolean(user.protected),
    bioEntities,
    pinnedTweet: pinned,
  };
}

// ============================================================
// Analysis: 実ツイート配列から客観指標を算出
// ============================================================
export function buildAnalysis(tweets: XTweet[]): AnalysisData {
  if (tweets.length === 0) {
    return {
      analyzedPosts: 0,
      analyzedDays: 0,
      postsPerDay: 0,
      peakHour: 0,
      hourlyCounts: Array(24).fill(0),
      composition: { original: 0, reply: 0, quoted: 0 },
      media: { textOnly: 0, withMedia: 0, withLink: 0 },
      topLanguage: "unknown",
      languages: [],
    };
  }

  // 時間範囲
  const times = tweets
    .map((t) => new Date(t.created_at).getTime())
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  const spanMs = times.length > 1 ? times[times.length - 1] - times[0] : 0;
  const analyzedDays = Math.max(1, Math.round(spanMs / (1000 * 60 * 60 * 24)));
  const postsPerDay = Math.round((tweets.length / analyzedDays) * 10) / 10;

  // 時間帯分布 (JST)
  const hourlyCounts: number[] = Array(24).fill(0);
  for (const t of tweets) {
    const d = new Date(t.created_at);
    if (Number.isNaN(d.getTime())) continue;
    // JST (UTC+9)
    const jstHour = (d.getUTCHours() + 9) % 24;
    hourlyCounts[jstHour] += 1;
  }
  const peakHour = hourlyCounts.indexOf(Math.max(...hourlyCounts));

  // 投稿構成
  const composition: TweetComposition = { original: 0, reply: 0, quoted: 0 };
  for (const t of tweets) {
    const isReply = Boolean(t.in_reply_to_user_id);
    const isQuoted = t.referenced_tweets?.some((r) => r.type === "quoted") ?? false;
    if (isQuoted) composition.quoted += 1;
    else if (isReply) composition.reply += 1;
    else composition.original += 1;
  }

  // メディア構成
  const media: MediaComposition = { textOnly: 0, withMedia: 0, withLink: 0 };
  for (const t of tweets) {
    const hasMedia = (t.attachments?.media_keys?.length ?? 0) > 0;
    const externalUrls = (t.entities?.urls ?? []).filter((u) => {
      const target = u.expanded_url ?? u.url;
      return !target.includes("x.com") && !target.includes("twitter.com") && !target.includes("t.co");
    });
    const hasLink = externalUrls.length > 0;
    if (hasMedia) media.withMedia += 1;
    else if (hasLink) media.withLink += 1;
    else media.textOnly += 1;
  }

  // 言語分布
  const langMap = new Map<string, number>();
  for (const t of tweets) {
    const lang = t.lang ?? "unknown";
    langMap.set(lang, (langMap.get(lang) ?? 0) + 1);
  }
  const languages = Array.from(langMap.entries())
    .map(([lang, count]) => ({ lang, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const topLanguage = languages[0]?.lang ?? "unknown";

  return {
    analyzedPosts: tweets.length,
    analyzedDays,
    postsPerDay,
    peakHour,
    hourlyCounts,
    composition,
    media,
    topLanguage,
    languages,
  };
}

// ============================================================
// Heatmap / Emotion / Hash helpers (premium 用)
// ============================================================
function buildHeatmap(tweets: XTweet[]): number[][] {
  // 7 days (Sun..Sat) × 24 hours (JST)
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const t of tweets) {
    const d = new Date(t.created_at);
    if (Number.isNaN(d.getTime())) continue;
    const jstMs = d.getTime() + 9 * 60 * 60 * 1000;
    const jst = new Date(jstMs);
    grid[jst.getUTCDay()][jst.getUTCHours()] += 1;
  }
  return grid;
}

function aggregateEmotion(classified: ClassifiedTweet[]): EmotionProfile {
  const counts: EmotionProfile = { anger: 0, contempt: 0, mockery: 0, threat: 0, sadness: 0 };
  let total = 0;
  for (const c of classified) {
    if (c.severity === "none" || !c.emotion) continue;
    counts[c.emotion] += 1;
    total += 1;
  }
  if (total === 0) return counts;
  const k: (keyof EmotionProfile)[] = ["anger", "contempt", "mockery", "threat", "sadness"];
  for (const key of k) {
    counts[key] = Math.round((counts[key] / total) * 100);
  }
  return counts;
}

function attachHashes(classified: ClassifiedTweet[]): ClassifiedTweet[] {
  const capturedAt = new Date().toISOString();
  return classified.map((c) => ({
    ...c,
    hash: createHash("sha256").update(`${c.tweet_id}|${c.created_at}|${c.text}`).digest("hex"),
    capturedAt,
  }));
}

// ============================================================
// Main entry point
// ============================================================
export interface BuildDiagnosisIncludes {
  mediaByKey?: Map<string, XMedia>;
  referencedById?: Map<string, XReferencedTweet>;
  usersById?: Map<string, XUser>;
  pinnedTweet?: XReferencedTweet | null;
}

/** Enrich classified tweets with original tweet metadata + includes data. */
function enrichClassified(
  classified: ClassifiedTweet[],
  tweets: XTweet[],
  includes: BuildDiagnosisIncludes,
): ClassifiedTweet[] {
  const { mediaByKey, referencedById, usersById } = includes;
  const tweetById = new Map(tweets.map((t) => [t.id, t]));

  return classified.map((c) => {
    const original = tweetById.get(c.tweet_id);
    if (!original) return c;

    const enriched: ClassifiedTweet = { ...c };
    enriched.metrics = {
      likes: original.public_metrics.like_count,
      rt: original.public_metrics.retweet_count,
      reply: original.public_metrics.reply_count,
      impressions: original.public_metrics.impression_count,
      bookmarks: original.public_metrics.bookmark_count,
    };
    enriched.possiblySensitive = original.possibly_sensitive;
    enriched.isLongForm = Boolean(original.note_tweet);
    enriched.source = original.source;

    const refRel = original.referenced_tweets?.find(
      (r) => r.type === "replied_to" || r.type === "quoted",
    );
    if (refRel && referencedById) {
      const ref = referencedById.get(refRel.id);
      if (ref) {
        const author = ref.author_id && usersById ? usersById.get(ref.author_id) : undefined;
        enriched.referencedTweet = {
          type: refRel.type as "replied_to" | "quoted",
          text: ref.note_tweet?.text ?? ref.text,
          authorUsername: author?.username,
          authorName: author?.name,
          likes: ref.public_metrics?.like_count,
          rt: ref.public_metrics?.retweet_count,
        };
      }
    }

    const mediaKeys = original.attachments?.media_keys ?? [];
    if (mediaByKey && mediaKeys.length > 0) {
      const mapped = mediaKeys
        .map((k) => mediaByKey.get(k))
        .filter((m): m is XMedia => Boolean(m))
        .map((m) => ({
          type: m.type,
          previewImageUrl: m.preview_image_url ?? m.url,
          altText: m.alt_text,
        }));
      if (mapped.length > 0) enriched.media = mapped;
    }

    if (original.context_annotations && original.context_annotations.length > 0) {
      enriched.contextTopics = original.context_annotations
        .slice(0, 5)
        .map((ca) => ({ domain: ca.domain.name, entity: ca.entity.name }));
    }

    return enriched;
  });
}

export function buildDiagnosis(
  user: XUser,
  tweets: XTweet[],
  rawClassified: ClassifiedTweet[],
  includes: BuildDiagnosisIncludes = {},
): DiagnosisData {
  const classified = enrichClassified(rawClassified, tweets, includes);
  // Score: sum of severity weights, normalized to 0-100
  const rawScore = classified.reduce((acc, c) => acc + (SEVERITY_WEIGHT[c.severity] ?? 0), 0);
  const score = Math.min(
    100,
    Math.round((rawScore / Math.max(50, classified.length * 2)) * 100),
  );
  const level = levelFromScore(score);

  // Category aggregation
  const categoryNames: CategoryName[] = ["名誉毀損", "侮辱", "脅迫", "プライバシー侵害"];
  const categories = categoryNames.map((name) => ({
    name,
    count: classified.filter((c) => c.category === name).length,
  }));

  // Top problem posts (high/medium severity, sorted)
  const problem = classified.filter((c) => c.severity !== "none");
  const topPosts = problem
    .sort((a, b) => (SEVERITY_WEIGHT[b.severity] ?? 0) - (SEVERITY_WEIGHT[a.severity] ?? 0))
    .slice(0, 3)
    .map((c) => ({
      text: c.text,
      category: c.category === "該当なし" ? "その他" : c.category,
      severity: c.severity === "none" ? "low" : c.severity,
      date: new Date(c.created_at).toLocaleDateString("ja-JP"),
    }));

  // Reply ratio (replies / total)
  const replyCount = tweets.filter((t) => t.in_reply_to_user_id).length;
  const replyRatio = tweets.length > 0 ? Math.round((replyCount / tweets.length) * 1000) / 10 : 0;

  // Mention frequency
  const mentionMap = new Map<string, number>();
  tweets.forEach((t) => {
    t.entities?.mentions?.forEach((m) => {
      mentionMap.set(m.username, (mentionMap.get(m.username) ?? 0) + 1);
    });
  });
  const mentionedUsers = Array.from(mentionMap.entries())
    .map(([handle, count]) => ({ handle, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Hostile keyword extraction (simple substring match)
  const hostileKeywords = HOSTILE_KEYWORDS.map((word) => {
    const count = tweets.reduce(
      (acc, t) => acc + (t.text.includes(word) ? 1 : 0),
      0,
    );
    return { word, count };
  })
    .filter((k) => k.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Monthly problem post counts (last 3 months)
  const now = new Date();
  const monthly: { month: string; count: number }[] = [];
  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getMonth() + 1}月`;
    const count = problem.filter((c) => {
      const cd = new Date(c.created_at);
      return cd.getFullYear() === d.getFullYear() && cd.getMonth() === d.getMonth();
    }).length;
    monthly.push({ month: ym, count });
  }

  return {
    username: user.username,
    level,
    score,
    totalPosts: tweets.length,
    problemPosts: problem.length,
    categories,
    topPosts: topPosts as DiagnosisData["topPosts"],
    replyRatio,
    mentionedUsers,
    hostileKeywords,
    monthlyProblemPosts: monthly,
    profile: buildProfile(user, includes.pinnedTweet),
    analysis: buildAnalysis(tweets),
    evidence: attachHashes(classified.filter((c) => c.severity !== "none")),
    emotionProfile: aggregateEmotion(classified),
    timeHeatmap: buildHeatmap(tweets),
    source: "x-api+claude",
    analyzedAt: new Date().toISOString(),
  };
}
