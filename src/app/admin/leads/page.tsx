// ============================================================
// /admin/leads — リード一覧（検索・フィルタ・ページネーション対応）
// ============================================================

import Link from "next/link";
import { searchLeads, type LeadKind } from "@/lib/leads";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const KIND_OPTIONS: { key: LeadKind | "all"; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "diagnose", label: "診断" },
  { key: "line_click", label: "LINEクリック" },
  { key: "line_registered", label: "LINE登録" },
  { key: "x_oauth", label: "X OAuth" },
];

interface SearchParams {
  kind?: string;
  q?: string;         // username search
  from?: string;      // ISO date
  to?: string;        // ISO date
  campaign?: string;
  page?: string;
}

function buildQuery(base: SearchParams, override: Partial<SearchParams>): string {
  const params = new URLSearchParams();
  const merged = { ...base, ...override };
  for (const [k, v] of Object.entries(merged)) {
    if (v != null && v !== "" && v !== "all") params.set(k, v);
  }
  const q = params.toString();
  return q ? `?${q}` : "";
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const kindParam = sp.kind ?? "all";
  const kind: LeadKind | undefined =
    kindParam === "diagnose" ||
    kindParam === "line_click" ||
    kindParam === "line_registered" ||
    kindParam === "x_oauth"
      ? kindParam
      : undefined;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  // from/to は yyyy-mm-dd 形式の date input 値を受け取る想定
  const fromIso = sp.from ? new Date(sp.from + "T00:00:00").toISOString() : null;
  const toIso = sp.to ? new Date(sp.to + "T23:59:59").toISOString() : null;

  const { rows, total } = await searchLeads({
    kind,
    username: sp.q?.trim() || null,
    campaign: sp.campaign?.trim() || null,
    from: fromIso,
    to: toIso,
    limit: PAGE_SIZE,
    offset,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">リード一覧</h1>
        <p className="mt-1 text-xs text-slate-500">
          診断実行・LINEクリックのログ。検索条件は URL に保持されるのでリンク共有 OK。
        </p>
      </div>

      {/* ===== Filter bar ===== */}
      <form method="get" className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-500">種別</label>
            <select
              name="kind"
              defaultValue={kindParam}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs"
            >
              {KIND_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500">Xアカウント検索</label>
            <input
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="部分一致"
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500">キャンペーン</label>
            <input
              name="campaign"
              defaultValue={sp.campaign ?? ""}
              placeholder="tk_0411 等"
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500">From</label>
            <input
              type="date"
              name="from"
              defaultValue={sp.from ?? ""}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500">To</label>
            <input
              type="date"
              name="to"
              defaultValue={sp.to ?? ""}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs"
            />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end gap-2">
          <Link
            href="/admin/leads"
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            クリア
          </Link>
          <button
            type="submit"
            className="rounded-md bg-violet-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-violet-700"
          >
            絞り込む
          </button>
        </div>
      </form>

      {/* ===== Results table ===== */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-2 font-semibold">#</th>
              <th className="px-4 py-2 font-semibold">種別</th>
              <th className="px-4 py-2 font-semibold">Xアカウント</th>
              <th className="px-4 py-2 font-semibold">キャンペーン</th>
              <th className="px-4 py-2 font-semibold">IP</th>
              <th className="px-4 py-2 font-semibold">日時</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  該当するリードがありません
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 font-mono text-slate-400">{r.id}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      r.kind === "diagnose"
                        ? "bg-violet-100 text-violet-700"
                        : r.kind === "line_click"
                        ? "bg-emerald-100 text-emerald-700"
                        : r.kind === "line_registered"
                        ? "bg-[#06c755]/20 text-[#04a043]"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {r.kind}
                  </span>
                </td>
                <td className="px-4 py-2 font-mono font-bold text-slate-800">
                  {r.query_username ? `@${r.query_username}` : "-"}
                </td>
                <td className="px-4 py-2 text-slate-600">
                  {r.utm_campaign ? (
                    <span className="rounded bg-amber-50 px-1.5 py-0.5 font-mono text-[10px] text-amber-700">
                      {r.utm_campaign}
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="px-4 py-2 text-slate-500">{r.ip ?? "-"}</td>
                <td className="px-4 py-2 whitespace-nowrap text-slate-500">
                  {new Date(r.created_at).toLocaleString("ja-JP")}
                </td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/admin/leads/${r.id}`}
                    className="text-[11px] font-semibold text-violet-600 hover:underline"
                  >
                    詳細 →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===== Pagination ===== */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <p>
          {total.toLocaleString("ja-JP")} 件中 {offset + 1}-
          {Math.min(offset + PAGE_SIZE, total)} 件表示
        </p>
        <div className="flex items-center gap-2">
          {page > 1 && (
            <Link
              href={`/admin/leads${buildQuery(sp, { page: String(page - 1) })}`}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
            >
              ← 前へ
            </Link>
          )}
          <span className="font-mono text-slate-400">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/admin/leads${buildQuery(sp, { page: String(page + 1) })}`}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
            >
              次へ →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
