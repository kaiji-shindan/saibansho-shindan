// ============================================================
// GET /api/diagnose/[username]
// Query params:
//   ?mock=1     → force mock data (bypass real APIs)
//   ?nocache=1  → bypass cache and re-analyze
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { diagnose } from "@/lib/diagnose";
import type { DiagnosisResponse } from "@/lib/diagnose-types";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ username: string }> },
): Promise<NextResponse<DiagnosisResponse>> {
  const { username } = await ctx.params;
  const url = new URL(req.url);
  const forceMock = url.searchParams.get("mock") === "1";
  const noCache = url.searchParams.get("nocache") === "1";

  try {
    const data = await diagnose(username, { forceMock, noCache });
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/diagnose] failed:", message);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}
