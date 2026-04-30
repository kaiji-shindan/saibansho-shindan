// ============================================================
// GET /admin/leads.csv
// リード全件 CSV エクスポート。middleware で Basic 認証済み。
// ============================================================

import { NextRequest } from "next/server";
import { listLeads } from "@/lib/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvEscape(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(_req: NextRequest) { // eslint-disable-line @typescript-eslint/no-unused-vars
  const rows = await listLeads({ limit: 10_000 });
  const header = [
    "id",
    "kind",
    "query_username",
    "session_id",
    "line_user_id",
    "x_user_id",
    "ip",
    "user_agent",
    "referrer",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "landing_path",
    "created_at",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.id,
        r.kind,
        r.query_username,
        r.session_id,
        r.line_user_id,
        r.x_user_id,
        r.ip,
        r.user_agent,
        r.referrer,
        r.utm_source,
        r.utm_medium,
        r.utm_campaign,
        r.utm_content,
        r.utm_term,
        r.landing_path,
        r.created_at,
      ]
        .map(csvEscape)
        .join(","),
    );
  }
  const body = "\ufeff" + lines.join("\n"); // BOM for Excel

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kaiji_leads_${Date.now()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
