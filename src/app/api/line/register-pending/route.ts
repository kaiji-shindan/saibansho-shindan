// ============================================================
// POST /api/line/register-pending
//
// LIFF page から呼ばれる。{ userId, username, displayName } を受け取り、
// pending_links に保存し、すでに友だちなら即パーソナライズメッセージを送る。
// 友だちでない場合は webhook (follow) で送る。
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import {
  buildFollowMessages,
  getPublicSiteUrl,
  pushToUser,
} from "@/lib/line-messaging";
import {
  savePendingLink,
  deletePendingLink,
} from "@/lib/line-pending";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { userId?: string; username?: string; displayName?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const userId = body.userId?.trim();
  const username = body.username?.trim();
  if (!userId || !username) {
    return NextResponse.json(
      { ok: false, error: "userId and username required" },
      { status: 400 },
    );
  }

  // 1. Save mapping (so webhook can look it up if user follows later)
  await savePendingLink(userId, username, body.displayName ?? null);

  // 2. Try to push immediately (works only if user is already a friend)
  const messages = buildFollowMessages(username, getPublicSiteUrl());
  const result = await pushToUser(userId, messages);

  if (result.ok) {
    // Already a friend — message delivered. No need to keep pending.
    await deletePendingLink(userId);
    return NextResponse.json({ ok: true, sent: true });
  }

  // Not a friend yet — pending kept for webhook follow event.
  return NextResponse.json({
    ok: true,
    sent: false,
    needsFriend: true,
    debug: process.env.NODE_ENV === "development" ? result.body : undefined,
  });
}
