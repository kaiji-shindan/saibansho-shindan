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
  public_metrics?: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
    listed_count: number;
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
  public_metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
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
 * Requests all public profile fields we currently display in the UI.
 */
export async function getUserByUsername(username: string): Promise<XUser> {
  const data = await xFetch<{ data: XUser }>(`/users/by/username/${encodeURIComponent(username)}`, {
    "user.fields":
      "created_at,description,profile_image_url,public_metrics,verified,verified_type,url",
  });
  if (!data?.data) throw new XApiError("User not found", 404);
  return data.data;
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
  const data = await xFetch<{ data?: XTweet[] }>(`/users/${userId}/tweets`, {
    max_results: String(Math.min(Math.max(max, 5), 100)),
    "tweet.fields":
      "created_at,in_reply_to_user_id,public_metrics,entities,referenced_tweets,lang,attachments",
    exclude: "retweets",
  });
  return data?.data ?? [];
}

export function isXConfigured(): boolean {
  return Boolean(process.env.X_BEARER_TOKEN);
}
