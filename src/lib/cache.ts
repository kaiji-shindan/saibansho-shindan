// ============================================================
// Diagnosis cache — Supabase-backed with in-memory fallback
//
// Table schema (run in Supabase SQL editor):
//
//   create table if not exists diagnose_cache (
//     username text primary key,
//     data jsonb not null,
//     analyzed_at timestamptz not null default now()
//   );
//   create index if not exists diagnose_cache_analyzed_at_idx
//     on diagnose_cache(analyzed_at);
//
// ============================================================

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { DiagnosisData } from "./diagnose-types";

const TTL_SECONDS = Number(process.env.DIAGNOSE_CACHE_TTL ?? 86400);

// In-memory fallback (per server instance)
const memCache = new Map<string, { data: DiagnosisData; ts: number }>();

let supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient | null {
  if (supabase) return supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  supabase = createClient(url, key, { auth: { persistSession: false } });
  return supabase;
}

export async function getCached(username: string): Promise<DiagnosisData | null> {
  // Memory first (fast path)
  const mem = memCache.get(username);
  if (mem && Date.now() - mem.ts < TTL_SECONDS * 1000) {
    return mem.data;
  }

  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from("diagnose_cache")
    .select("data, analyzed_at")
    .eq("username", username)
    .maybeSingle();
  if (error || !data) return null;

  const age = (Date.now() - new Date(data.analyzed_at).getTime()) / 1000;
  if (age > TTL_SECONDS) return null;

  // Warm memory cache for next call
  memCache.set(username, { data: data.data as DiagnosisData, ts: Date.now() });
  return data.data as DiagnosisData;
}

export async function setCached(username: string, data: DiagnosisData): Promise<void> {
  memCache.set(username, { data, ts: Date.now() });

  const sb = getSupabase();
  if (!sb) return;
  await sb
    .from("diagnose_cache")
    .upsert({ username, data, analyzed_at: new Date().toISOString() });
}
