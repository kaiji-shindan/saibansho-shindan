// ============================================================
// /admin/leads/[id] — リード詳細
// 単一イベントの情報 + 同一セッションのタイムラインを表示
// ============================================================

import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeadById, getSessionTimeline, type LeadRow } from "@/lib/leads";

export const dynamic = "force-dynamic";

/** Format an ISO timestamp as JST 24-hour clock (yyyy/m/d HH:mm:ss). */
function fmtJst(iso: string): string {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(d);
  const time = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
  return `${date} ${time}`;
}

function kindBadge(kind: string): string {
  switch (kind) {
    case "diagnose":
      return "bg-violet-100 text-violet-700";
    case "line_click":
      return "bg-emerald-100 text-emerald-700";
    case "line_registered":
      return "bg-[#06c755]/20 text-[#04a043]";
    case "x_oauth":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 break-all font-mono text-xs text-slate-800">
        {value && value.length > 0 ? value : <span className="text-slate-400">—</span>}
      </p>
    </div>
  );
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (!Number.isFinite(numId)) notFound();

  const lead = await getLeadById(numId);
  if (!lead) notFound();

  const timeline: LeadRow[] = lead.session_id
    ? await getSessionTimeline(lead.session_id)
    : [lead];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/leads"
          className="text-[11px] font-semibold text-violet-600 hover:underline"
        >
          ← リード一覧へ
        </Link>
        <h1 className="mt-2 flex items-center gap-3 text-xl font-extrabold tracking-tight">
          リード #{lead.id}
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${kindBadge(lead.kind)}`}>
            {lead.kind}
          </span>
        </h1>
        <p className="mt-1 text-xs text-slate-500">{fmtJst(lead.created_at)}</p>
      </div>

      {/* ===== Overview ===== */}
      <section>
        <h2 className="text-sm font-extrabold">基本情報</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Xアカウント</p>
            {lead.query_username ? (
              <a
                href={`https://x.com/${lead.query_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block break-all font-mono text-xs font-bold text-violet-700 hover:underline"
              >
                @{lead.query_username} ↗
              </a>
            ) : (
              <p className="mt-1 break-all font-mono text-xs text-slate-400">—</p>
            )}
          </div>
          <Field label="Session ID" value={lead.session_id} />
          <Field label="IP" value={lead.ip} />
          <Field label="User Agent" value={lead.user_agent} />
          <Field label="Referrer" value={lead.referrer} />
          <Field label="Landing Path" value={lead.landing_path} />
        </div>
      </section>

      {/* ===== Attribution ===== */}
      <section>
        <h2 className="text-sm font-extrabold">流入元 (UTM)</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Source" value={lead.utm_source} />
          <Field label="Medium" value={lead.utm_medium} />
          <Field label="Campaign" value={lead.utm_campaign} />
          <Field label="Content" value={lead.utm_content} />
          <Field label="Term" value={lead.utm_term} />
        </div>
      </section>

      {/* ===== Future: LINE / X identity ===== */}
      <section>
        <h2 className="text-sm font-extrabold">外部アカウント</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="LINE User ID" value={lead.line_user_id} />
          <Field label="X User ID" value={lead.x_user_id} />
        </div>
        <p className="mt-2 text-[10px] text-slate-400">
          ※ LINE Login / X OAuth 導入後に自動で紐付きます。
        </p>
      </section>

      {/* ===== Session timeline ===== */}
      <section>
        <h2 className="text-sm font-extrabold">同一セッションのアクション履歴</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2 font-semibold">#</th>
                <th className="px-4 py-2 font-semibold">種別</th>
                <th className="px-4 py-2 font-semibold">対象Xアカウント</th>
                <th className="px-4 py-2 font-semibold">日時</th>
              </tr>
            </thead>
            <tbody>
              {timeline.map((t) => (
                <tr
                  key={t.id}
                  className={`border-t border-slate-100 ${t.id === lead.id ? "bg-violet-50" : ""}`}
                >
                  <td className="px-4 py-2 font-mono text-slate-400">{t.id}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${kindBadge(t.kind)}`}>
                      {t.kind}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-mono font-bold">
                    {t.query_username ? (
                      <a
                        href={`https://x.com/${t.query_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        @{t.query_username}
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-slate-500">
                    {fmtJst(t.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
