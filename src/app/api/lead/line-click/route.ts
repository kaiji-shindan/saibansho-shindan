// ============================================================
// POST /api/lead/line-click
//   Body: { username?: string }
//   - leads テーブルに line_click を記録
//   - kaiji_line_verified cookie をセット
//   → UI 側はこの cookie / localStorage をチェックしてロック解除
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { recordLead, extractClientInfo } from "@/lib/leads";
import { notifyLead } from "@/lib/notify";
import { LINE_VERIFIED_COOKIE, LINE_VERIFIED_VALUE } from "@/lib/line";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { username?: string } = {};
  try {
    body = await req.json();
  } catch {
    // Body 無しでも受ける（純粋なクリック記録）
  }

  const info = extractClientInfo(req);

  recordLead({
    kind: "line_click",
    queryUsername: body.username ?? null,
    sessionId: info.sessionId,
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

  // 高価値イベント: Slack 通知を送る。弁護士事務所の担当者が
  // LINE トークに新着が来る前に把握できるように。
  notifyLead({
    kind: "line_click",
    queryUsername: body.username ?? null,
    sessionId: info.sessionId,
    ip: info.ip,
    userAgent: info.userAgent,
    utmSource: info.utmSource,
    utmMedium: info.utmMedium,
    utmCampaign: info.utmCampaign,
    utmContent: info.utmContent,
    utmTerm: info.utmTerm,
    landingPath: info.landingPath,
  }).catch(() => {});

  const res = NextResponse.json({ ok: true });
  res.cookies.set(LINE_VERIFIED_COOKIE, LINE_VERIFIED_VALUE, {
    httpOnly: false, // UI 側でも読みたい
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 180, // 180日
  });
  return res;
}
