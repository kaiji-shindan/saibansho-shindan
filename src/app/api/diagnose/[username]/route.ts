// ============================================================
// GET /api/diagnose/[username]
// Query params:
//   ?mock=1     → force mock data (dev/preview のみ有効)
//   ?nocache=1  → bypass cache and re-analyze
//
// Side effect: 実データでの診断時のみリード記録する (mock では記録しない)。
// 初回呼び出し時に kaiji_sid cookie を発行する。
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { diagnose, DiagnoseConfigError } from "@/lib/diagnose";
import type { DiagnosisResponse } from "@/lib/diagnose-types";
import { recordLead, extractClientInfo } from "@/lib/leads";
import { applyDiagnoseRateLimit } from "@/lib/rate-limit";
import { isValidXUsername } from "@/lib/parse-username";

export const runtime = "nodejs";

const IS_PROD = process.env.NODE_ENV === "production";

/** `?mock=1` is always allowed: mock data is harmless (no leads recording,
 *  no X / Claude calls, no cache writes), so we let admins use it in prod
 *  to preview the UI without burning credits. */
function isMockQueryAllowed(): boolean {
  return true;
}

function ensureSessionId(req: NextRequest): { sid: string; isNew: boolean } {
  const existing = req.cookies.get("kaiji_sid")?.value;
  if (existing) return { sid: existing, isNew: false };
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const sid = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return { sid, isNew: true };
}

function setSidCookie(res: NextResponse, sid: string) {
  res.cookies.set("kaiji_sid", sid, {
    httpOnly: true,
    sameSite: "lax",
    secure: IS_PROD,
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ username: string }> },
): Promise<NextResponse<DiagnosisResponse>> {
  const { username } = await ctx.params;
  const url = new URL(req.url);
  const forceMock = isMockQueryAllowed() && url.searchParams.get("mock") === "1";
  const noCache = url.searchParams.get("nocache") === "1";

  const { sid, isNew } = ensureSessionId(req);
  const info = extractClientInfo(req);

  // ----- 入力検証: X 公式仕様 (半角英数字 + アンダースコア、1〜15文字) -----
  // 全角日本語などをハンドルとして弾き、存在しないアカウントの診断記録を防ぐ。
  const normalizedUsername = username.replace(/^@/, "").trim();
  if (!isValidXUsername(normalizedUsername)) {
    const res = NextResponse.json<DiagnosisResponse>(
      {
        ok: false,
        error:
          "X のユーザー名は半角英数字とアンダースコア（1〜15文字）で指定してください。",
      },
      { status: 400 },
    );
    if (isNew) setSidCookie(res, sid);
    return res;
  }

  // ----- Rate limit (IP ベース) -----
  const rlIp = info.ip ?? "unknown";
  const rl = applyDiagnoseRateLimit(rlIp);
  if (rl) {
    const res = NextResponse.json<DiagnosisResponse>(
      { ok: false, error: "Rate limited. Please slow down." },
      { status: 429 },
    );
    res.headers.set("Retry-After", Math.ceil(rl.resetInMs / 1000).toString());
    res.headers.set("X-RateLimit-Limit", rl.limit.toString());
    res.headers.set("X-RateLimit-Remaining", "0");
    if (isNew) setSidCookie(res, sid);
    return res;
  }

  try {
    const data = await diagnose(normalizedUsername, { forceMock, noCache });

    // 診断成功時のみリード記録 (X 上に存在しない / 取得失敗のものを B2B 資産に混ぜない)。
    // mock リクエストも記録しない (架空の診断データのため)。
    if (!forceMock) {
      recordLead({
        kind: "diagnose",
        queryUsername: normalizedUsername,
        sessionId: sid,
        ip: info.ip,
        userAgent: info.userAgent,
        referrer: info.referrer,
        utmSource: info.utmSource,
        utmMedium: info.utmMedium,
        utmCampaign: info.utmCampaign,
        utmContent: info.utmContent,
        utmTerm: info.utmTerm,
        landingPath: info.landingPath,
      }).catch(() => {});
    }

    const res = NextResponse.json({ ok: true, data });
    if (isNew) setSidCookie(res, sid);
    return res;
  } catch (err) {
    // env 不備は 503 (Service Unavailable) として返す
    if (err instanceof DiagnoseConfigError) {
      console.error("[/api/diagnose] config missing:", err.message);
      const res = NextResponse.json(
        { ok: false, error: err.message },
        { status: 503 },
      );
      if (isNew) setSidCookie(res, sid);
      return res;
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/diagnose] failed:", message);
    const res = NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
    if (isNew) setSidCookie(res, sid);
    return res;
  }
}
