// ============================================================
// Rate limiter — in-memory sliding window
//
// X API (Basic tier $200/月) の枠を守るための緊急ブレーキ。
// 本番で大規模にスケールする場合は Redis / Upstash に置き換える。
// ============================================================

interface Bucket {
  // Monotonic timestamps (ms) of requests within the window.
  hits: number[];
}

// per-process in-memory store. Per-region / per-instance OK for MVP.
const store = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
  limit: number;
}

/**
 * @param key       e.g. `diagnose:${ip}` — namespace + identity
 * @param limit     max requests per window
 * @param windowMs  window size in ms
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;

  const bucket = store.get(key) ?? { hits: [] };
  // Drop expired hits — keeps memory bounded.
  bucket.hits = bucket.hits.filter((t) => t > cutoff);

  if (bucket.hits.length >= limit) {
    // Reset when the oldest hit rolls out of the window.
    const oldest = bucket.hits[0];
    return {
      allowed: false,
      remaining: 0,
      resetInMs: Math.max(0, oldest + windowMs - now),
      limit,
    };
  }

  bucket.hits.push(now);
  store.set(key, bucket);

  // Opportunistic garbage collection — every ~1000 calls.
  if (store.size > 5000 && Math.random() < 0.01) {
    for (const [k, b] of store) {
      b.hits = b.hits.filter((t) => t > cutoff);
      if (b.hits.length === 0) store.delete(k);
    }
  }

  return {
    allowed: true,
    remaining: Math.max(0, limit - bucket.hits.length),
    resetInMs: windowMs,
    limit,
  };
}

// ============================================================
// Preset policies
// ============================================================

/** Per-IP diagnose quota: 10 requests / minute, 60 / hour */
export const DIAGNOSE_POLICIES = {
  minute: { limit: 10, windowMs: 60_000 },
  hour: { limit: 60, windowMs: 3_600_000 },
} as const;

/** Returns the first failing bucket, or `null` if both pass. */
export function applyDiagnoseRateLimit(ip: string): RateLimitResult | null {
  for (const [name, policy] of Object.entries(DIAGNOSE_POLICIES)) {
    const res = checkRateLimit(`diag:${name}:${ip}`, policy.limit, policy.windowMs);
    if (!res.allowed) return res;
  }
  return null;
}
