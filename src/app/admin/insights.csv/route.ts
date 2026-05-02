// ============================================================
// GET /admin/insights.csv
// 期間内の診断ランキング CSV エクスポート。middleware で Basic 認証済み。
// ============================================================

import { NextRequest } from "next/server";
import {
  getDiagnoseRanking,
  getProfileSnapshots,
  type InsightsPeriod,
} from "@/lib/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_PERIODS: InsightsPeriod[] = ["24h", "7d", "30d", "all"];

function csvEscape(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const periodParam = url.searchParams.get("period") ?? "7d";
  const period = (VALID_PERIODS.includes(periodParam as InsightsPeriod)
    ? (periodParam as InsightsPeriod)
    : "7d") as InsightsPeriod;

  const ranking = await getDiagnoseRanking(period, 500);
  const profiles = await getProfileSnapshots(ranking.map((r) => r.username));

  const header = [
    "rank",
    "username",
    "display_name",
    "diagnose_count",
    "unique_sessions",
    "line_click_count",
    "followers",
    "following",
    "total_tweets",
    "verified_type",
    "first_at",
    "last_at",
  ];
  const lines = [header.join(",")];
  ranking.forEach((r, i) => {
    const p = profiles.get(r.username);
    lines.push(
      [
        i + 1,
        r.username,
        p?.displayName ?? "",
        r.diagnoseCount,
        r.uniqueSessions,
        r.lineClickCount,
        p?.followers ?? "",
        p?.following ?? "",
        p?.totalTweets ?? "",
        p?.verifiedType ?? "",
        r.firstAt,
        r.lastAt,
      ]
        .map(csvEscape)
        .join(","),
    );
  });

  const body = "﻿" + lines.join("\n");
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kaiji_insights_${period}_${Date.now()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
