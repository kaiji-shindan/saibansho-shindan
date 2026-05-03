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
        `ご登録ありがとうございます！\n` +
        `開示請求診断 公式アカウントです🧑‍⚖️\n\n` +
        `@${username} の詳細レポートをお送りします。\n` +
        `下のURLから閲覧してください👇\n\n` +
        `📊 ${username} の詳細レポート\n${premiumUrl}\n\n` +
        `▼ 閲覧できる内容\n` +
        `・問題投稿の全件リストと分類\n` +
        `・法令別カテゴリ内訳（名誉毀損・侮辱・脅迫・プライバシー侵害）\n` +
        `・発信者情報開示請求書テンプレート\n` +
        `・PDF形式の証拠レポート\n\n` +
        `🔐 ご本人確認のため、閲覧時に X (Twitter) でのログインを求められます。@${username} 本人のみが閲覧可能です。\n\n` +
        `別のアカウントを診断したい場合はこちら👇\n${homeUrl}`,
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
        `ご登録ありがとうございます！\n` +
        `開示請求診断 公式アカウントです🧑‍⚖️\n\n` +
        `当アカウントでは、X（旧Twitter）の投稿が発信者情報開示請求の対象となるかを診断し、詳細レポートをお送りします。\n\n` +
        `▼ ご利用の流れ（完全無料）\n` +
        `①下記サイトで診断したいXアカウントを入力\n` +
        `${cleanUrl}\n` +
        `②診断結果ページで「LINEで詳細を受け取る」をタップ\n` +
        `③このトーク画面に詳細レポートのURLが届きます\n\n` +
        `📊 詳細レポートに含まれる内容\n` +
        `・問題投稿の全件リストと分類\n` +
        `・発信者情報開示請求書テンプレート\n` +
        `・PDF形式の証拠レポート\n\n` +
        `🔐 詳細レポート閲覧時は X (Twitter) でのご本人ログインが必要です（診断対象アカウント本人のみ閲覧可）。`,
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
