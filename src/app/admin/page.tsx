// ============================================================
// /admin — ダッシュボード (Server Component)
// KPI カード + 直近の診断履歴・LINE 登録ログを表示
// ============================================================

import Link from "next/link";
import { getLeadStats, listLeads, getCampaignStats, getDailySeries } from "@/lib/leads";
import { DailyChart } from "@/components/admin/daily-chart";

export const dynamic = "force-dynamic";

function fmt(n: number): string {
  return n.toLocaleString("ja-JP");
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "たった今";
  if (min < 60) return `${min}分前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}時間前`;
  const d = Math.floor(h / 24);
  return `${d}日前`;
}

export default async function AdminDashboardPage() {
  const [stats, recentDiagnose, recentLine, campaigns, series] = await Promise.all([
    getLeadStats(),
    listLeads({ kind: "diagnose", limit: 20 }),
    listLeads({ kind: "line_click", limit: 20 }),
    getCampaignStats(8),
    getDailySeries(30),
  ]);

  const topCampaignDiagnoses = Math.max(1, ...campaigns.map((c) => c.diagnoses));

  const kpis = [
    { label: "総診断数", value: fmt(stats.totalDiagnose), sub: `直近24h: ${fmt(stats.last24hDiagnose)}`, accent: "text-violet-600" },
    { label: "ユニークXアカウント", value: fmt(stats.uniqueUsernames), sub: "重複除外ベース", accent: "text-indigo-600" },
    { label: "LINEクリック数", value: fmt(stats.totalLineClick), sub: "リードの入口", accent: "text-[#06c755]" },
    { label: "LINE登録確認済", value: fmt(stats.totalLineRegistered), sub: "LINE Login 実装後のみ", accent: "text-emerald-600" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">ダッシュボード</h1>
        <p className="mt-1 text-xs text-slate-500">
          開示請求診断のリード取得状況。この画面は法律事務所向けの閲覧用です。
        </p>
      </div>

      {/* KPI cards */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-semibold text-slate-500">{k.label}</p>
            <p className={`mt-1 text-2xl font-black tracking-tight ${k.accent}`}>{k.value}</p>
            <p className="mt-1 text-[10px] text-slate-400">{k.sub}</p>
          </div>
        ))}
      </section>

      {/* Daily trend chart */}
      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-extrabold">日次トレンド (過去30日)</h2>
          <span className="text-[10px] text-slate-400">JST基準</span>
        </div>
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
          <DailyChart data={series} />
        </div>
      </section>

      {/* Campaign attribution */}
      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-extrabold">キャンペーン別リード</h2>
          <span className="text-[10px] text-slate-400">utm_campaign ベース</span>
        </div>
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {campaigns.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-slate-400">
              まだキャンペーン流入はありません
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-2 font-semibold">キャンペーン</th>
                  <th className="px-4 py-2 font-semibold">Source</th>
                  <th className="px-4 py-2 font-semibold">診断数</th>
                  <th className="px-4 py-2 font-semibold">LINEクリック</th>
                  <th className="px-4 py-2 font-semibold">CVR</th>
                  <th className="px-4 py-2 font-semibold">分布</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const cvr = c.diagnoses > 0 ? (c.lineClicks / c.diagnoses) * 100 : 0;
                  const pct = (c.diagnoses / topCampaignDiagnoses) * 100;
                  return (
                    <tr key={`${c.campaign}::${c.source}`} className="border-t border-slate-100">
                      <td className="px-4 py-2">
                        {c.campaign === "(direct)" ? (
                          <span className="text-slate-400">直接</span>
                        ) : (
                          <Link
                            href={`/admin/leads?campaign=${encodeURIComponent(c.campaign)}`}
                            className="font-mono font-bold text-amber-700 hover:underline"
                          >
                            {c.campaign}
                          </Link>
                        )}
                      </td>
                      <td className="px-4 py-2 text-slate-500">{c.source}</td>
                      <td className="px-4 py-2 font-extrabold text-violet-600">
                        {c.diagnoses.toLocaleString("ja-JP")}
                      </td>
                      <td className="px-4 py-2 font-extrabold text-[#06c755]">
                        {c.lineClicks.toLocaleString("ja-JP")}
                      </td>
                      <td className="px-4 py-2 font-semibold text-slate-700">{cvr.toFixed(1)}%</td>
                      <td className="px-4 py-2">
                        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-violet-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Recent diagnose */}
      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-extrabold">直近の診断履歴</h2>
          <Link href="/admin/leads" className="text-[11px] font-semibold text-violet-600 hover:underline">
            全件を見る →
          </Link>
        </div>
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2 font-semibold">Xアカウント</th>
                <th className="px-4 py-2 font-semibold">セッション</th>
                <th className="px-4 py-2 font-semibold">IP</th>
                <th className="px-4 py-2 font-semibold">リファラ</th>
                <th className="px-4 py-2 font-semibold">時刻</th>
              </tr>
            </thead>
            <tbody>
              {recentDiagnose.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    まだ診断リクエストはありません
                  </td>
                </tr>
              )}
              {recentDiagnose.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-mono font-bold text-slate-800">@{r.query_username ?? "-"}</td>
                  <td className="px-4 py-2 font-mono text-[10px] text-slate-500">
                    {r.session_id ? r.session_id.slice(0, 10) + "…" : "-"}
                  </td>
                  <td className="px-4 py-2 text-slate-500">{r.ip ?? "-"}</td>
                  <td className="px-4 py-2 max-w-[180px] truncate text-slate-500">{r.referrer ?? "-"}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-slate-500">{relTime(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent LINE clicks */}
      <section>
        <h2 className="text-sm font-extrabold">直近のLINE登録クリック</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2 font-semibold">Xアカウント</th>
                <th className="px-4 py-2 font-semibold">セッション</th>
                <th className="px-4 py-2 font-semibold">IP</th>
                <th className="px-4 py-2 font-semibold">時刻</th>
              </tr>
            </thead>
            <tbody>
              {recentLine.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    まだLINE登録クリックはありません
                  </td>
                </tr>
              )}
              {recentLine.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-mono font-bold text-slate-800">
                    {r.query_username ? `@${r.query_username}` : "-"}
                  </td>
                  <td className="px-4 py-2 font-mono text-[10px] text-slate-500">
                    {r.session_id ? r.session_id.slice(0, 10) + "…" : "-"}
                  </td>
                  <td className="px-4 py-2 text-slate-500">{r.ip ?? "-"}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-slate-500">{relTime(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
