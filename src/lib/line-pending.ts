// ============================================================
// line_pending_links — LIFF→follow webhook の username 紐付け
//
// LIFF page で取得した LINE userId と診断対象 username を保存し、
// follow webhook で参照してパーソナライズメッセージを送る。
// ============================================================

import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface PendingLink {
  line_user_id: string;
  pending_username: string;
  display_name: string | null;
  created_at: string;
}

/** Upsert: store the latest pending username per LINE userId. */
export async function savePendingLink(
  lineUserId: string,
  username: string,
  displayName: string | null,
): Promise<void> {
  const sb = getSupabase();
  if (!sb) {
    console.warn("[line-pending] supabase not configured; skipping save");
    return;
  }

  const { error } = await sb
    .from("line_pending_links")
    .upsert(
      {
        line_user_id: lineUserId,
        pending_username: username,
        display_name: displayName,
      },
      { onConflict: "line_user_id" },
    );

  if (error) {
    console.error("[line-pending] save failed:", error.message);
  }
}

/** Look up the pending username for this LINE userId. */
export async function getPendingLink(lineUserId: string): Promise<PendingLink | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from("line_pending_links")
    .select("*")
    .eq("line_user_id", lineUserId)
    .maybeSingle();

  if (error) {
    console.error("[line-pending] fetch failed:", error.message);
    return null;
  }
  return (data as PendingLink) ?? null;
}

/** Delete the pending link after successful delivery. */
export async function deletePendingLink(lineUserId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  const { error } = await sb
    .from("line_pending_links")
    .delete()
    .eq("line_user_id", lineUserId);

  if (error) {
    console.error("[line-pending] delete failed:", error.message);
  }
}
