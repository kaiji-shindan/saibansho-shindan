// ============================================================
// /admin — ダッシュボード (Server Component)
// KPI カード + 直近の診断履歴・LINE 登録ログ・X OAuth ログを表示
// ============================================================

import Link from "next/link";
import {
  getLeadStats,
  listLeads,
  getCampaignStats,
  getDailySeries,
  getSupabaseHealth,
  getLinePendingLinks,
} from "@/lib/leads";
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
  const [health, stats, recentDiagnose, recentLine, recentXOauth, lineLinks, campaigns, series] =
    await Promise.all([
      getSupabaseHealth(),
      getLeadStats(),
      listLeads({ kind: "diagnose", limit: 20 }),
      listLeads({ kind: "line_click", limit: 20 }),
      listLeads({ kind: "x_oauth", limit: 20 }),
      getLinePendingLinks(50),
      getCampaignStats(8),
      getDailySeries(30),
    ]);

  const topCampaignDiagnoses = Math.max(1, ...campaigns.map((c) => c.diagnoses));

  const kpis = [
    { label: "総診断数", value: fmt(stats.totalDiagnose), sub: `直近24h: ${fmt(stats.last24hDiagnose)}`, accent: "text-violet-600" },
    { label: "ユニークXアカウント", value: fmt(stats.uniqueUsernames), sub: "重複除外ベース", accent: "text-indigo-600" },
    { label: "LINEクリック", value: fmt(stats.totalLineClick), sub: "リードの入口", accent: "text-[#06c755]" },
    { label: "LINE登録 (Webhook)", value: fmt(stats.totalLineRegistered), sub: "follow イベント受信", accent: "text-emerald-600" },
    { label: "X OAuth 連携", value: fmt(stats.totalXOauth), sub: "premium アクセス可", accent: "text-slate-700" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">ダッシュボード</h1>
        <p className="mt-1 text-xs text-slate-500">
          開示請求診断のリード取得状況。この画面は法律事務所向けの閲覧用です。
        </p>
      </div>

      {/* Supabase health banner — surfaces config issues to operator */}
      {!health.reachable && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-extrabold text-rose-900">⚠️ データベースに接続できません</p>
          <p className="mt-1 text-xs leading-relaxed text-rose-700">
            {health.errorMessage ?? "原因不明のエラーです。"}
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-rose-600">
            Vercel の Environment Variables で <code className="rounded bg-rose-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code> と{" "}
            <code className="rounded bg-rose-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> が正しく設定されているか確認してください。
          </p>
        </div>
      )}

      {/* KPI cards */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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

      {/* Linked accounts (LINE → diagnose target) */}
      {lineLinks.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-extrabold">LINE 登録ユーザーと診断対象の紐付け</h2>
            <span className="text-[10px] text-slate-400">line_pending_links / 最新50件</span>
          </div>
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-2 font-semibold">LINE 表示名</th>
                  <th className="px-4 py-2 font-semibold">診断対象 X</th>
                  <th className="px-4 py-2 font-semibold">LINE userId (一部)</th>
                  <th className="px-4 py-2 font-semibold">登録時刻</th>
                </tr>
              </thead>
              <tbody>
                {lineLinks.map((l) => (
                  <tr key={l.line_user_id} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-bold text-slate-800">{l.display_name ?? "(不明)"}</td>
                    <td className="px-4 py-2 font-mono font-bold text-indigo-700">@{l.pending_username}</td>
                    <td className="px-4 py-2 font-mono text-[10px] text-slate-500">
                      {l.line_user_id.slice(0, 12) + "…"}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-slate-500">{relTime(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

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
                  <td className="px-4 py-2 font-mono font-bold text-slate-800">
                    {r.query_username ? (
                      <a
                        href={`https://x.com/${r.query_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        @{r.query_username}
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
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

      {/* Recent X OAuth */}
      <section>
        <h2 className="text-sm font-extrabold">直近の X OAuth 連携</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2 font-semibold">Xハンドル</th>
                <th className="px-4 py-2 font-semibold">X user ID</th>
                <th className="px-4 py-2 font-semibold">セッション</th>
                <th className="px-4 py-2 font-semibold">時刻</th>
              </tr>
            </thead>
            <tbody>
              {recentXOauth.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    まだ X OAuth 連携はありません
                  </td>
                </tr>
              )}
              {recentXOauth.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-mono font-bold text-slate-800">
                    {r.query_username ? (
                      <a
                        href={`https://x.com/${r.query_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        @{r.query_username}
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-2 font-mono text-[10px] text-slate-500">{r.x_user_id ?? "-"}</td>
                  <td className="px-4 py-2 font-mono text-[10px] text-slate-500">
                    {r.session_id ? r.session_id.slice(0, 10) + "…" : "-"}
                  </td>
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
                    {r.query_username ? (
                      <a
                        href={`https://x.com/${r.query_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        @{r.query_username}
                      </a>
                    ) : (
                      "-"
                    )}
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
