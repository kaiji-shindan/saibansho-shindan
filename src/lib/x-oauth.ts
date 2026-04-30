// ============================================================
// X (Twitter) OAuth 2.0 — Authorization Code + PKCE
//
// ユーザーの X アカウントを正規に取得するためのフロー。
// 取得した x_user_id / handle は leads テーブルに保存し、
// 管理画面で B2B 向けに閲覧可能にする。
//
// 必要な環境変数:
//   X_CLIENT_ID       (X Developer Portal の OAuth 2.0 Client ID)
//   X_CLIENT_SECRET   (Confidential Client の場合のみ。Public Client ならば空)
//   NEXT_PUBLIC_SITE_URL  (コールバック URL 組み立て用)
//
// X 側の設定:
//   - App Type: Web App, Confidential client (推奨)
//   - Callback URI: ${SITE_URL}/api/auth/x/callback
//   - Website URL: ${SITE_URL}
//   - Scopes: users.read tweet.read
// ============================================================

export const X_OAUTH_STATE_COOKIE = "x_oauth_state";
export const X_OAUTH_VERIFIER_COOKIE = "x_oauth_verifier";
export const X_OAUTH_RETURN_COOKIE = "x_oauth_return";

export const X_SCOPES = ["users.read", "tweet.read"] as const;

const X_AUTHORIZE_URL = "https://twitter.com/i/oauth2/authorize";
const X_TOKEN_URL = "https://api.twitter.com/2/oauth2/token";
const X_ME_URL = "https://api.twitter.com/2/users/me";

export function isXOauthConfigured(): boolean {
  return Boolean(process.env.X_CLIENT_ID);
}

export function getRedirectUri(): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${site.replace(/\/$/, "")}/api/auth/x/callback`;
}

// ============================================================
// PKCE helpers
// ============================================================
function randomBytes(n: number): Uint8Array {
  const arr = new Uint8Array(n);
  crypto.getRandomValues(arr);
  return arr;
}

function base64url(bytes: Uint8Array | ArrayBuffer): string {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let str = "";
  for (let i = 0; i < u8.length; i++) str += String.fromCharCode(u8[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function generateState(): string {
  return base64url(randomBytes(16));
}

export function generateCodeVerifier(): string {
  // 43-128 chars per RFC 7636. 32 bytes → 43 base64url chars.
  return base64url(randomBytes(32));
}

export async function codeChallengeFromVerifier(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64url(digest);
}

// ============================================================
// Authorize URL
// ============================================================
export function buildAuthorizeUrl(state: string, codeChallenge: string): string {
  const clientId = process.env.X_CLIENT_ID;
  if (!clientId) throw new Error("X_CLIENT_ID is not configured");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    scope: X_SCOPES.join(" "),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `${X_AUTHORIZE_URL}?${params.toString()}`;
}

// ============================================================
// Token exchange
// ============================================================
export interface XTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
  refresh_token?: string;
}

export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
): Promise<XTokenResponse> {
  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  if (!clientId) throw new Error("X_CLIENT_ID is not configured");

  const body = new URLSearchParams({
    code,
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    code_verifier: codeVerifier,
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  if (clientSecret) {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    headers["Authorization"] = `Basic ${basic}`;
  }

  const res = await fetch(X_TOKEN_URL, {
    method: "POST",
    headers,
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`X token exchange failed (${res.status}): ${text}`);
  }
  return (await res.json()) as XTokenResponse;
}

// ============================================================
// /2/users/me
// ============================================================
export interface XMeResponse {
  data: {
    id: string;
    username: string;
    name: string;
  };
}

export async function fetchXMe(accessToken: string): Promise<XMeResponse> {
  const res = await fetch(X_ME_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`X /users/me failed (${res.status}): ${text}`);
  }
  return (await res.json()) as XMeResponse;
}
