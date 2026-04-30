// ============================================================
// GET /api/auth/x/start
//   ?return=/diagnose/foo/premium
//
// PKCE + state 生成 → cookie 保存 → X の authorize エンドポイントへ
// リダイレクトする。
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import {
  buildAuthorizeUrl,
  codeChallengeFromVerifier,
  generateCodeVerifier,
  generateState,
  isXOauthConfigured,
  X_OAUTH_RETURN_COOKIE,
  X_OAUTH_STATE_COOKIE,
  X_OAUTH_VERIFIER_COOKIE,
} from "@/lib/x-oauth";

export const runtime = "nodejs";

const FIVE_MIN = 60 * 5;

export async function GET(req: NextRequest) {
  if (!isXOauthConfigured()) {
    return NextResponse.json(
      { ok: false, error: "X OAuth is not configured (X_CLIENT_ID missing)" },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const rawReturn = url.searchParams.get("return") ?? "/";
  // Only allow relative paths on our own domain
  const returnTo = rawReturn.startsWith("/") && !rawReturn.startsWith("//") ? rawReturn : "/";

  const state = generateState();
  const verifier = generateCodeVerifier();
  const challenge = await codeChallengeFromVerifier(verifier);

  const authorizeUrl = buildAuthorizeUrl(state, challenge);
  const res = NextResponse.redirect(authorizeUrl);

  const cookieOpts = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: FIVE_MIN,
    secure: process.env.NODE_ENV === "production",
  };
  res.cookies.set(X_OAUTH_STATE_COOKIE, state, cookieOpts);
  res.cookies.set(X_OAUTH_VERIFIER_COOKIE, verifier, cookieOpts);
  res.cookies.set(X_OAUTH_RETURN_COOKIE, returnTo, cookieOpts);

  return res;
}
