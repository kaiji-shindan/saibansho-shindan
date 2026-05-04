// ============================================================
// GET /api/auth/x/callback?code=...&state=...
//
// cookie の state を検証 → code をアクセストークンと交換 →
// /2/users/me でプロフィール取得 → leads に x_oauth を記録 →
// return URL へ戻す。cookie に kaiji_x_user も書き込んで
// クライアントが「連携済み」を判定できるようにする。
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForToken,
  fetchXMe,
  X_OAUTH_RETURN_COOKIE,
  X_OAUTH_STATE_COOKIE,
  X_OAUTH_VERIFIER_COOKIE,
} from "@/lib/x-oauth";
import { extractClientInfo, recordLead } from "@/lib/leads";
import { notifyLead } from "@/lib/notify";
import { isValidXUsername } from "@/lib/parse-username";

export const runtime = "nodejs";

/** Shown to the user when something goes wrong. Keeps UX informative. */
function errorRedirect(origin: string, reason: string): NextResponse {
  const u = new URL("/diagnose/-/x-error", origin);
  u.searchParams.set("reason", reason);
  return NextResponse.redirect(u);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) return errorRedirect(url.origin, `x_returned_${error}`);
  if (!code || !state) return errorRedirect(url.origin, "missing_code_or_state");

  const cookieState = req.cookies.get(X_OAUTH_STATE_COOKIE)?.value;
  const cookieVerifier = req.cookies.get(X_OAUTH_VERIFIER_COOKIE)?.value;
  const returnTo = req.cookies.get(X_OAUTH_RETURN_COOKIE)?.value ?? "/";

  if (!cookieState || !cookieVerifier) {
    return errorRedirect(url.origin, "no_cookie_state");
  }
  if (cookieState !== state) {
    return errorRedirect(url.origin, "state_mismatch");
  }

  let xUserId: string | null = null;
  let xUsername: string | null = null;

  try {
    const token = await exchangeCodeForToken(code, cookieVerifier);
    const me = await fetchXMe(token.access_token);
    xUserId = me.data.id;
    xUsername = me.data.username;
  } catch (err) {
    console.error("[x-oauth callback] failed:", err);
    return errorRedirect(url.origin, "token_exchange_failed");
  }

  // ----- Extract the diagnose target from returnTo path -----
  // returnTo は通常 "/diagnose/<target>/premium..." の形なので、ここから対象を抜く。
  // X 公式仕様 (^[A-Za-z0-9_]{1,15}$) に合わない場合は null に落として
  // 不正な username が leads に混入しないようにする。
  let diagnoseTarget: string | null = null;
  try {
    const m = returnTo.match(/^\/diagnose\/([^\/?#]+)(?:\/|$|\?|#)/);
    if (m) {
      const candidate = decodeURIComponent(m[1]).replace(/^@/, "");
      if (isValidXUsername(candidate)) diagnoseTarget = candidate;
    }
  } catch { /* ignore */ }

  // ----- Record the lead -----
  // query_username = 診断対象 (本人/第三者判定の基準)
  // x_user_id / x_username = 認証された診断者の X 情報
  const info = extractClientInfo(req);
  recordLead({
    kind: "x_oauth",
    queryUsername: diagnoseTarget,
    sessionId: info.sessionId,
    xUserId,
    xUsername,
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

  notifyLead({
    kind: "x_oauth",
    queryUsername: diagnoseTarget,
    sessionId: info.sessionId,
    ip: info.ip,
    userAgent: info.userAgent,
    utmSource: info.utmSource,
    utmCampaign: info.utmCampaign,
  }).catch(() => {});

  // ----- Redirect back and set client cookie -----
  const finalUrl = new URL(returnTo, url.origin);
  const res = NextResponse.redirect(finalUrl);

  // Clear OAuth temp cookies
  res.cookies.set(X_OAUTH_STATE_COOKIE, "", { path: "/", maxAge: 0 });
  res.cookies.set(X_OAUTH_VERIFIER_COOKIE, "", { path: "/", maxAge: 0 });
  res.cookies.set(X_OAUTH_RETURN_COOKIE, "", { path: "/", maxAge: 0 });

  // Set a readable cookie (non-HttpOnly) so client can render "@handle 連携済み"
  if (xUsername) {
    res.cookies.set("kaiji_x_handle", xUsername, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30日
    });
  }

  return res;
}
