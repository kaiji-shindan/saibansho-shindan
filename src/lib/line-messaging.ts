// ============================================================
// LINE Messaging API helpers
//
// Server-side only. Uses LINE_CHANNEL_ACCESS_TOKEN to push messages
// and LINE_CHANNEL_SECRET to validate webhook signatures.
// ============================================================

import crypto from "crypto";

const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";

/** Build the personalized message body sent right after follow. */
export function buildFollowMessages(username: string, siteUrl: string) {
  const cleanUrl = siteUrl.replace(/\/$/, "");
  const premiumUrl = `${cleanUrl}/diagnose/${encodeURIComponent(username)}/premium`;
  const homeUrl = cleanUrl;

  return [
    {
      type: "text",
      text:
        `@${username} の診断結果が完成しました🎉\n\n` +
        `📊 詳細レポートはこちら\n${premiumUrl}\n\n` +
        `▼ 解放されるコンテンツ\n` +
        `・問題投稿の全件リスト\n` +
        `・カテゴリ別の法令該当性\n` +
        `・開示請求書テンプレート（PDF出力可）\n\n` +
        `別のアカウントを診断する場合はこちら👉\n${homeUrl}\n\n` +
        `※ 本サービスは情報整理ツールです。法的助言・弁護士のご紹介は行っておりません。`,
    },
  ];
}

/** Generic greeting for users who follow without a pending diagnosis. */
export function buildGenericGreetingMessages(siteUrl: string) {
  const cleanUrl = siteUrl.replace(/\/$/, "");
  return [
    {
      type: "text",
      text:
        `ご登録ありがとうございます。\n` +
        `開示請求診断 公式アカウントです🙏\n\n` +
        `📊 まずは無料診断をお試しください\n${cleanUrl}\n\n` +
        `Xのアカウント名を入力するだけで、誹謗中傷の法的リスクを整理します。\n\n` +
        `※ 本サービスは情報整理ツールです。法的助言・弁護士のご紹介は行っておりません。`,
    },
  ];
}

/**
 * Push messages to a specific LINE user via the Messaging API.
 * Returns the response status; throws only on network errors.
 */
export async function pushToUser(
  userId: string,
  messages: unknown[],
): Promise<{ ok: boolean; status: number; body: string }> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    return { ok: false, status: 0, body: "LINE_CHANNEL_ACCESS_TOKEN missing" };
  }

  const res = await fetch(LINE_PUSH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ to: userId, messages }),
  });

  const body = await res.text();
  return { ok: res.ok, status: res.status, body };
}

/**
 * Validate the x-line-signature header against the raw request body.
 * Returns true if the signature matches our channel secret.
 */
export function validateLineSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret || !signature) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("base64");

  // Constant-time compare
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Resolve the public site URL for use inside push messages. */
export function getPublicSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://saibansho-shindan.vercel.app"
  );
}
