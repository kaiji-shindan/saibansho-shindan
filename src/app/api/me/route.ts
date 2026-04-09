// ============================================================
// GET /api/me — Victim mode dashboard data
//
// Mock-first: returns rich dummy data unless the user has connected
// their X account via OAuth (Phase 3A future work).
// ============================================================

import { NextResponse } from "next/server";
import { generateMockMe } from "@/lib/me-mock";
import type { MeData } from "@/lib/me-types";

export const runtime = "nodejs";

interface MeResponse {
  ok: boolean;
  data?: MeData;
  error?: string;
}

export async function GET(): Promise<NextResponse<MeResponse>> {
  try {
    // TODO: when X OAuth is wired up, fetch the user's mentions/DMs and
    // run them through classifyTweets() the same way the public diagnose
    // pipeline does. For now we always return mock data so the UI is
    // demoable end-to-end without keys.
    const data = generateMockMe();
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
