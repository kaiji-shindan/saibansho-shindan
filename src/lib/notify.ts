// ============================================================
// Slack / Webhook 通知
//
// 新しいリードが入ったら弁護士事務所のオペレーション担当に
// リアルタイム通知する。未設定時は何もしない (fire-and-forget)。
//
// 対応フォーマット:
//   - Slack Incoming Webhook (JSON text)
//   - Discord / 汎用 Webhook (text フィールドに payload を入れる)
//
// 環境変数:
//   SLACK_WEBHOOK_URL       Slack 互換 Webhook URL
//   NOTIFY_WEBHOOK_URL      汎用フォールバック URL
// ============================================================

import type { LeadKind, Attribution } from "./leads";

const EVENT_LABELS: Record<LeadKind, string> = {
  diagnose: "診断実行",
  line_click: "LINE登録クリック",
  line_registered: "LINE登録完了",
  x_oauth: "X OAuth 連携",
};

const EVENT_EMOJIS: Record<LeadKind, string> = {
  diagnose: ":mag:",
  line_click: ":bell:",
  line_registered: ":white_check_mark:",
  x_oauth: ":link:",
};

export interface NotifyPayload extends Attribution {
  kind: LeadKind;
  queryUsername?: string | null;
  sessionId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

function formatSlackBlocks(p: NotifyPayload) {
  const label = EVENT_LABELS[p.kind];
  const emoji = EVENT_EMOJIS[p.kind];
  const headline = `${emoji} *${label}*${p.queryUsername ? ` — @${p.queryUsername}` : ""}`;

  const fields: { type: "mrkdwn"; text: string }[] = [];
  if (p.queryUsername) fields.push({ type: "mrkdwn", text: `*X アカウント*\n\`@${p.queryUsername}\`` });
  if (p.utmCampaign) fields.push({ type: "mrkdwn", text: `*キャンペーン*\n\`${p.utmCampaign}\`` });
  if (p.utmSource)   fields.push({ type: "mrkdwn", text: `*Source*\n\`${p.utmSource}\`` });
  if (p.sessionId)   fields.push({ type: "mrkdwn", text: `*Session*\n\`${p.sessionId.slice(0, 10)}…\`` });
  if (p.ip)          fields.push({ type: "mrkdwn", text: `*IP*\n\`${p.ip}\`` });

  return {
    text: headline, // fallback for notifications
    blocks: [
      { type: "section", text: { type: "mrkdwn", text: headline } },
      ...(fields.length > 0
        ? [{ type: "section", fields: fields.slice(0, 10) }]
        : []),
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `開示請求診断 Admin ｜ ${new Date().toLocaleString("ja-JP")}`,
          },
        ],
      },
    ],
  };
}

/** Fire-and-forget. Never throws. Never blocks the caller. */
export async function notifyLead(p: NotifyPayload): Promise<void> {
  const slackUrl = process.env.SLACK_WEBHOOK_URL;
  const genericUrl = process.env.NOTIFY_WEBHOOK_URL;
  if (!slackUrl && !genericUrl) return;

  const payload = formatSlackBlocks(p);

  const targets: string[] = [];
  if (slackUrl) targets.push(slackUrl);
  if (genericUrl && genericUrl !== slackUrl) targets.push(genericUrl);

  await Promise.allSettled(
    targets.map((url) =>
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        // Webhook は外向きなのでタイムアウトを短く
        signal: AbortSignal.timeout(5000),
      }).catch(() => {}),
    ),
  );
}
