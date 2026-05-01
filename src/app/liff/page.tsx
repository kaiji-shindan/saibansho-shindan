// ============================================================
// /liff — LIFF endpoint that runs inside LINE app
//
// Flow:
//   1. LIFF SDK init
//   2. Fetch profile (LINE userId)
//   3. POST /api/line/register-pending with { userId, username, displayName }
//   4. Show success / friend-add prompt
// ============================================================

import { LiffClient } from "./client";

export const dynamic = "force-dynamic";

export default async function LiffPage({
  searchParams,
}: {
  searchParams: Promise<{ username?: string }>;
}) {
  const sp = await searchParams;
  return <LiffClient username={sp.username ?? ""} />;
}
