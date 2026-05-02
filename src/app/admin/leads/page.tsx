// ============================================================
// /admin/leads — リード一覧（検索・フィルタ・ページネーション対応）
// ============================================================

import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { searchLeads, getProfileSnapshots, type LeadKind, type LeadRow } from "@/lib/leads";

type SortKey = "id" | "kind" | "username" | "followers" | "following" | "tweets" | "date";
type SortDir = "asc" | "desc";

function sortLeads(
  rows: LeadRow[],
  profiles: Map<string, { followers: number | null; following: number | null; totalTweets: number | null }>,
  sort: SortKey,
  dir: SortDir,
): LeadRow[] {
  const factor = dir === "asc" ? 1 : -1;
  const rank = (a: number | null | undefined): number =>
    a == null ? Number.NEGATIVE_INFINITY : a;
  return [...rows].sort((a, b) => {
    switch (sort) {
      case "id":
        return (a.id - b.id) * factor;
      case "kind":
        return a.kind.localeCompare(b.kind) * factor;
      case "username":
        return (a.query_username ?? "").localeCompare(b.query_username ?? "") * factor;
      case "followers":
        return (rank(profiles.get(a.query_username ?? "")?.followers) -
          rank(profiles.get(b.query_username ?? "")?.followers)) * factor;
      case "following":
        return (rank(profiles.get(a.query_username ?? "")?.following) -
          rank(profiles.get(b.query_username ?? "")?.following)) * factor;
      case "tweets":
        return (rank(profiles.get(a.query_username ?? "")?.totalTweets) -
          rank(profiles.get(b.query_username ?? "")?.totalTweets)) * factor;
      case "date":
      default:
        return (
          (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * factor
        );
    }
  });
}

function fmtCount(n: number | null): string {
  if (n == null) return "-";
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString("ja-JP");
}

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
  sort?: string;      // id|kind|username|followers|following|tweets|date
  dir?: string;       // asc|desc
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

  // Fetch cached X profile data (avatar, follower count, etc.) for all
  // unique usernames in this page so the table can show them inline.
  const profiles = await getProfileSnapshots(
    rows.map((r) => r.query_username ?? "").filter(Boolean),
  );

  // Apply sort (post-fetch — the page size is small enough that this is fine)
  const sortKey = (sp.sort ?? "date") as SortKey;
  const sortDir = (sp.dir ?? "desc") as SortDir;
  const sortedRows = sortLeads(rows, profiles, sortKey, sortDir);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Sortable column header helper
  function SortLink({ column, label }: { column: SortKey; label: string }) {
    const isActive = sortKey === column;
    const nextDir: SortDir = isActive && sortDir === "desc" ? "asc" : "desc";
    const href =
      "/admin/leads" +
      buildQuery(sp, { sort: column, dir: nextDir, page: "1" });
    return (
      <Link
        href={href}
        className={`inline-flex items-center gap-1 hover:text-violet-600 ${
          isActive ? "text-violet-700" : "text-slate-600"
        }`}
      >
        {label}
        {isActive ? (
          sortDir === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </Link>
    );
  }

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
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold">
                <SortLink column="id" label="#" />
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold">
                <SortLink column="kind" label="種別" />
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold">
                <SortLink column="username" label="Xアカウント" />
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold">
                <SortLink column="followers" label="フォロワー" />
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold">
                <SortLink column="following" label="フォロー" />
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold">
                <SortLink column="tweets" label="投稿" />
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold">
                <SortLink column="date" label="日時" />
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {sortedRows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                  該当するリードがありません
                </td>
              </tr>
            )}
            {sortedRows.map((r) => {
              const username = r.query_username ?? "";
              const profile = username ? profiles.get(username) : undefined;
              const avatarUrl = username
                ? profile?.profileImageUrl ?? `https://unavatar.io/x/${username}`
                : null;
              return (
                <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-400">{r.id}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${
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
                  <td className="whitespace-nowrap px-4 py-3">
                    {username ? (
                      <a
                        href={`https://x.com/${username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 hover:underline"
                      >
                        {avatarUrl ? (
                          <Image
                            src={avatarUrl}
                            alt={`@${username}`}
                            width={32}
                            height={32}
                            unoptimized
                            className="shrink-0 rounded-full bg-slate-100 object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 shrink-0 rounded-full bg-slate-200" />
                        )}
                        <div className="flex min-w-0 max-w-[260px] flex-col">
                          <span className="flex items-center gap-1 truncate text-sm font-bold text-slate-800">
                            {profile?.displayName ?? `@${username}`}
                            {profile?.isVerified && (
                              <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                            )}
                          </span>
                          <span className="truncate font-mono text-xs text-slate-500">
                            @{username}
                          </span>
                        </div>
                      </a>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-slate-700">
                    {fmtCount(profile?.followers ?? null)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-slate-700">
                    {fmtCount(profile?.following ?? null)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-slate-700">
                    {fmtCount(profile?.totalTweets ?? null)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                    {fmtJst(r.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <Link
                      href={`/admin/leads/${r.id}`}
                      className="text-xs font-semibold text-violet-600 hover:underline"
                    >
                      詳細 →
                    </Link>
                  </td>
                </tr>
              );
            })}
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
