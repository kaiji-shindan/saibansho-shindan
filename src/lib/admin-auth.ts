// ============================================================
// Admin Basic auth
//
// 弁護士事務所への売却/貸出を想定した裏側管理画面のゲート。
//
// - 本番 (NODE_ENV === "production") では ADMIN_USER と ADMIN_PASSWORD が
//   必ず env に設定されていなければならない。未設定なら認証は常に失敗する
//   (フェイルクローズ)。
// - 開発環境 (NODE_ENV !== "production") でのみ admin/admin のフォールバック
//   を許す。
// ============================================================

import { NextResponse } from "next/server";

function tcEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** production 以外のみ有効なローカル開発用フォールバック。 */
const DEV_FALLBACK_USER = "admin";
const DEV_FALLBACK_PASS = "admin";

function getCredentials(): { user: string; pass: string } | null {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;
  if (user && pass) return { user, pass };
  if (process.env.NODE_ENV !== "production") {
    return { user: DEV_FALLBACK_USER, pass: DEV_FALLBACK_PASS };
  }
  // production で未設定 → 誰も通さない
  return null;
}

export function isAuthorized(authHeader: string | null): boolean {
  const creds = getCredentials();
  if (!creds) return false;
  if (!authHeader?.toLowerCase().startsWith("basic ")) return false;
  try {
    const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf8");
    const idx = decoded.indexOf(":");
    if (idx < 0) return false;
    const u = decoded.slice(0, idx);
    const p = decoded.slice(idx + 1);
    return tcEq(u, creds.user) && tcEq(p, creds.pass);
  } catch {
    return false;
  }
}

export function unauthorizedResponse(): NextResponse {
  // production で env 不備のときは中身を出さない
  const misconfigured =
    process.env.NODE_ENV === "production" &&
    (!process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD);

  if (misconfigured) {
    return new NextResponse(
      "Admin credentials are not configured on this deployment.",
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="kaiji-admin"',
      "Cache-Control": "no-store",
    },
  });
}
