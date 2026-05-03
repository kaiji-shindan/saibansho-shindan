// ============================================================
// POST /api/webhook/line
//
// LINE Messaging API の webhook 受信エンドポイント。
//   - 署名検証 (HMAC-SHA256, channel secret)
//   - follow イベントで pending_links を参照しパーソナライズ送信
//   - その他は無視
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import {
  buildFollowMessages,
  buildGenericGreetingMessages,
  getPublicSiteUrl,
  pushToUser,
  validateLineSignature,
} from "@/lib/line-messaging";
import {
  deletePendingLink,
  getPendingLink,
} from "@/lib/line-pending";
import { recordLead } from "@/lib/leads";

export const runtime = "nodejs";

interface LineEvent {
  type: string;
  source?: { type?: string; userId?: string };
  timestamp?: number;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-line-signature");

  if (!validateLineSignature(rawBody, signature)) {
    return NextResponse.json({ ok: false, error: "invalid signature" }, { status: 401 });
  }

  let payload: { events?: LineEvent[] };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const events = payload.events ?? [];

  // Process events in parallel — best-effort, don't fail the whole request on individual errors.
  await Promise.all(
    events.map(async (event) => {
      try {
        await handleEvent(event);
      } catch (err) {
        console.error("[line-webhook] event handling failed:", err);
      }
    }),
  );

  // LINE expects 200 even if individual events fail.
  return NextResponse.json({ ok: true });
}

async function handleEvent(event: LineEvent) {
  if (event.type !== "follow") {
    return;
  }
  const userId = event.source?.userId;
  if (!userId) return;

  const pending = await getPendingLink(userId);
  const siteUrl = getPublicSiteUrl();

  let messages: unknown[];
  let kind: "with_username" | "generic";

  if (pending?.pending_username) {
    messages = buildFollowMessages(pending.pending_username, siteUrl);
    kind = "with_username";
  } else {
    messages = buildGenericGreetingMessages(siteUrl);
    kind = "generic";
  }

  const result = await pushToUser(userId, messages);
  if (!result.ok) {
    console.error("[line-webhook] push failed:", result.status, result.body);
    return;
  }

  // Track the registration in leads for the admin dashboard.
  recordLead({
    kind: "line_registered",
    queryUsername: pending?.pending_username ?? null,
    sessionId: null,
    lineUserId: userId,
  }).catch(() => {});

  // Cleanup the pending link after successful delivery — kind に依らず削除。
  // 残しておくと再 follow 時に古い対象で再送される / TTL 任せでテーブルが
  // 肥大化する。pending が存在しなかった場合は no-op。
  await deletePendingLink(userId);
}
