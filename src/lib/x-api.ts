// ============================================================
// X (Twitter) API v2 client — minimal wrapper used by /api/diagnose
//
// 本プロジェクトの方針: X API Basic tier ($200/月) で「確実に取得できる」
// フィールドのみを使う。プロフィール実データはすべて public_metrics /
// user.fields / tweet.fields から取得する。
//
// Docs: https://docs.x.com/x-api/users/lookup-users-by-usernames
// ============================================================

const X_API_BASE = "https://api.twitter.com/2";

export type VerifiedType = "none" | "blue" | "business" | "government";

export interface XUser {
  id: string;
  username: string;
  name: string;
  created_at: string;
  description?: string;
  profile_image_url?: string;
  url?: string;
  verified?: boolean;
  verified_type?: VerifiedType;
  protected?: boolean;
  pinned_tweet_id?: string;
  most_recent_tweet_id?: string;
  public_metrics?: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
    listed_count: number;
  };
  entities?: {
    url?: { urls?: { url: string; expanded_url?: string; display_url?: string }[] };
    description?: {
      urls?: { url: string; expanded_url?: string; display_url?: string }[];
      hashtags?: { tag: string }[];
      mentions?: { username: string }[];
      cashtags?: { tag: string }[];
    };
  };
}

export interface XTweetReferencedTweet {
  type: "replied_to" | "quoted" | "retweeted";
  id: string;
}

export interface XTweet {
  id: string;
  text: string;
  created_at: string;
  lang?: string;
  in_reply_to_user_id?: string;
  source?: string;
  possibly_sensitive?: boolean;
  public_metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
    impression_count?: number;
    bookmark_count?: number;
  };
  referenced_tweets?: XTweetReferencedTweet[];
  attachments?: {
    media_keys?: string[];
  };
  entities?: {
    mentions?: { username: string }[];
    urls?: { url: string; expanded_url?: string }[];
    hashtags?: { tag: string }[];
  };
  /** Long-form (>280 chars) tweet content. When present, the canonical text. */
  note_tweet?: {
    text: string;
    entities?: {
      mentions?: { username: string }[];
      urls?: { url: string; expanded_url?: string }[];
      hashtags?: { tag: string }[];
    };
  };
  context_annotations?: {
    domain: { id: string; name: string; description?: string };
    entity: { id: string; name: string; description?: string };
  }[];
}

/** Media object returned via expansions */
export interface XMedia {
  media_key: string;
  type: "photo" | "video" | "animated_gif";
  url?: string;
  preview_image_url?: string;
  alt_text?: string;
  duration_ms?: number;
  width?: number;
  height?: number;
}

/** Referenced tweet (reply parent / quoted tweet) returned via expansions */
export interface XReferencedTweet {
  id: string;
  text: string;
  created_at: string;
  author_id?: string;
  lang?: string;
  public_metrics?: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
    quote_count: number;
  };
  note_tweet?: { text: string };
}

export interface XTweetsResponse {
  tweets: XTweet[];
  /** Map of media_key -> XMedia for attached media in any returned tweet. */
  mediaByKey: Map<string, XMedia>;
  /** Map of tweet id -> referenced tweet content (parent of replies, quoted tweets). */
  referencedById: Map<string, XReferencedTweet>;
  /** Map of user id -> XUser for authors of referenced tweets / mentions. */
  usersById: Map<string, XUser>;
}

class XApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "XApiError";
  }
}

function getBearer(): string {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) throw new XApiError("X_BEARER_TOKEN is not set");
  return token;
}

async function xFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${X_API_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${getBearer()}`,
      "User-Agent": "saibansho-shindan/1.0",
    },
    // X API responses are dynamic per user; do not cache at the fetch layer
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new XApiError(`X API ${res.status}: ${body.slice(0, 200)}`, res.status);
  }
  return res.json() as Promise<T>;
}

/**
 * Resolve a handle (without @) to a user object.
 * Requests all public profile fields we currently display in the UI, plus
 * the pinned tweet inline via `expansions=pinned_tweet_id` so we don't pay
 * for a second `/tweets/:id` call.
 */
export interface UserLookupResult {
  user: XUser;
  pinnedTweet: XReferencedTweet | null;
}

export async function getUserByUsername(username: string): Promise<UserLookupResult> {
  const data = await xFetch<{
    data: XUser;
    includes?: { tweets?: XReferencedTweet[] };
  }>(`/users/by/username/${encodeURIComponent(username)}`, {
    "user.fields":
      "created_at,description,profile_image_url,public_metrics,verified,verified_type,url,protected,pinned_tweet_id,most_recent_tweet_id,entities",
    "tweet.fields": "created_at,public_metrics,note_tweet,lang",
    expansions: "pinned_tweet_id",
  });
  if (!data?.data) throw new XApiError("User not found", 404);
  const pinnedTweet = data.includes?.tweets?.[0] ?? null;
  return { user: data.data, pinnedTweet };
}

/**
 * Fetch the most recent tweets for a user (default max=100, the API cap per request).
 * Note: X API Basic tier returns only the last ~7 days of tweets on active accounts.
 *
 * We explicitly request the fields needed for:
 *  - classification (text / created_at)
 *  - reply ratio (in_reply_to_user_id)
 *  - tweet composition (referenced_tweets)
 *  - media composition (attachments, entities.urls)
 *  - language detection (lang)
 *  - mention graph (entities.mentions)
 *  - engagement metrics (public_metrics)
 */
export async function getRecentTweets(userId: string, max = 100): Promise<XTweet[]> {
  const res = await getRecentTweetsWithIncludes(userId, max);
  return res.tweets;
}

/**
 * Fetch the most recent tweets together with the expanded `includes` block:
 *   - media       (preview_image_url, alt_text)
 *   - referenced_tweets (reply parent / quoted tweet bodies)
 *   - users       (authors of referenced tweets)
 *
 * All of this comes back in the same single billable request, so adding
 * these fields/expansions does not increase X API cost.
 */
export async function getRecentTweetsWithIncludes(
  userId: string,
  max = 100,
): Promise<XTweetsResponse> {
  const data = await xFetch<{
    data?: XTweet[];
    includes?: {
      media?: XMedia[];
      tweets?: XReferencedTweet[];
      users?: XUser[];
    };
  }>(`/users/${userId}/tweets`, {
    max_results: String(Math.min(Math.max(max, 5), 100)),
    "tweet.fields":
      "created_at,in_reply_to_user_id,public_metrics,entities,referenced_tweets,lang,attachments,source,possibly_sensitive,note_tweet,context_annotations",
    "user.fields":
      "username,name,verified,verified_type,profile_image_url",
    "media.fields": "type,url,preview_image_url,alt_text,duration_ms,height,width",
    expansions: "referenced_tweets.id,attachments.media_keys,referenced_tweets.id.author_id",
    exclude: "retweets",
  });

  const tweets = data?.data ?? [];
  const mediaByKey = new Map<string, XMedia>();
  for (const m of data?.includes?.media ?? []) mediaByKey.set(m.media_key, m);
  const referencedById = new Map<string, XReferencedTweet>();
  for (const t of data?.includes?.tweets ?? []) referencedById.set(t.id, t);
  const usersById = new Map<string, XUser>();
  for (const u of data?.includes?.users ?? []) usersById.set(u.id, u);

  return { tweets, mediaByKey, referencedById, usersById };
}

export function isXConfigured(): boolean {
  return Boolean(process.env.X_BEARER_TOKEN);
}
