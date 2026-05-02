// ============================================================
// /admin/insights — 集計ダッシュボード
//
// 「期間 × 診断回数の多いアカウント」を一覧化する画面。
// データソース: Supabase の leads テーブル（kind='diagnose' / 'line_click'）。
// X プロフィール（アバター・フォロワー数）は diagnose_cache から hydrate。
// ============================================================

import Link from "next/link";
import Image from "next/image";
import { FileDown, TrendingUp, AlertTriangle, Users } from "lucide-react";
import {
  getDiagnoseRanking,
  getInsightsTrend,
  getProfileSnapshots,
  type InsightsPeriod,
  type DailyPoint,
  type DiagnoseRankRow,
  type XProfileSnapshot,
} from "@/lib/leads";

export const dynamic = "force-dynamic";

const PERIOD_LABELS: Record<InsightsPeriod, string> = {
  "24h": "24時間",
  "7d": "7日間",
  "30d": "30日間",
  "all": "全期間",
};

const VALID_PERIODS: InsightsPeriod[] = ["24h", "7d", "30d", "all"];

// ============================================================
// 集団被害（同一加害者に対する複数の被害者）の判定
// 閾値: ユニーク Session ≥ 5 = high, 3〜4 = medium
// ============================================================
type ClusterTier = "high" | "medium" | "none";

function clusterTier(uniqueSessions: number): ClusterTier {
  if (uniqueSessions >= 5) return "high";
  if (uniqueSessions >= 3) return "medium";
  return "none";
}

const CLUSTER_STYLE: Record<
  Exclude<ClusterTier, "none">,
  { rowBg: string; badgeBg: string; badgeText: string; label: string }
> = {
  high: {
    rowBg: "bg-rose-50/60",
    badgeBg: "bg-rose-100",
    badgeText: "text-rose-700",
    label: "集団被害候補",
  },
  medium: {
    rowBg: "bg-amber-50/40",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-700",
    label: "複数被害",
  },
};

function fmtJst(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

function fmtNum(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("ja-JP");
}

// ============================================================
// SVG line chart (no external dep)
// ============================================================
function TrendChart({ data }: { data: DailyPoint[] }) {
  const W = 760;
  const H = 180;
  const PAD_L = 36;
  const PAD_R = 16;
  const PAD_T = 16;
  const PAD_B = 28;

  const inner = { w: W - PAD_L - PAD_R, h: H - PAD_T - PAD_B };
  const max = Math.max(1, ...data.map((d) => Math.max(d.diagnose, d.lineClick)));

  const points = (key: "diagnose" | "lineClick") =>
    data
      .map((d, i) => {
        const x = PAD_L + (i / Math.max(1, data.length - 1)) * inner.w;
        const y = PAD_T + inner.h - (d[key] / max) * inner.h;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  const xLabels = data
    .map((d, i) => ({ x: PAD_L + (i / Math.max(1, data.length - 1)) * inner.w, label: d.date.slice(5) }))
    .filter((_, i) => i % Math.max(1, Math.floor(data.length / 6)) === 0);

  const yTicks = [0, Math.round(max / 2), max];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full text-slate-500" preserveAspectRatio="xMidYMid meet">
      {/* horizontal grid */}
      {yTicks.map((t) => {
        const y = PAD_T + inner.h - (t / max) * inner.h;
        return (
          <g key={t}>
            <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.12" strokeDasharray="3 3" />
            <text x={PAD_L - 6} y={y + 3} fontSize="9" textAnchor="end" fill="currentColor" fillOpacity="0.6">{t}</text>
          </g>
        );
      })}
      {/* x labels */}
      {xLabels.map((l) => (
        <text key={l.x} x={l.x} y={H - 8} fontSize="9" textAnchor="middle" fill="currentColor" fillOpacity="0.6">
          {l.label}
        </text>
      ))}
      {/* line: line_click (背面) */}
      <polyline points={points("lineClick")} fill="none" stroke="#06c755" strokeWidth="1.5" strokeOpacity="0.65" />
      {/* line: diagnose (前面) */}
      <polyline points={points("diagnose")} fill="none" stroke="#7c3aed" strokeWidth="2" />
      {/* dots — diagnose only */}
      {data.map((d, i) => {
        const x = PAD_L + (i / Math.max(1, data.length - 1)) * inner.w;
        const y = PAD_T + inner.h - (d.diagnose / max) * inner.h;
        return <circle key={i} cx={x} cy={y} r="2" fill="#7c3aed" />;
      })}
    </svg>
  );
}

// ============================================================
// Page
// ============================================================
export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const sp = await searchParams;
  const period = (VALID_PERIODS.includes(sp.period as InsightsPeriod)
    ? (sp.period as InsightsPeriod)
    : "7d") as InsightsPeriod;

  // 並列で集計
  const [ranking, trend] = await Promise.all([
    getDiagnoseRanking(period, 50),
    getInsightsTrend(period),
  ]);

  const profiles = await getProfileSnapshots(ranking.map((r) => r.username));

  const totalDiagnose = ranking.reduce((acc, r) => acc + r.diagnoseCount, 0);
  const totalLineClick = ranking.reduce((acc, r) => acc + r.lineClickCount, 0);
  const uniqueAccounts = ranking.length;

  const clusterRows = ranking.filter((r) => clusterTier(r.uniqueSessions) !== "none");
  const highClusterCount = ranking.filter((r) => clusterTier(r.uniqueSessions) === "high").length;
  const mediumClusterCount = ranking.filter((r) => clusterTier(r.uniqueSessions) === "medium").length;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">インサイト</h1>
          <p className="mt-1 text-xs text-slate-500">
            診断回数の多い X アカウントを期間別に集計します。診断ログ自体は Supabase に永続保存されています。
          </p>
        </div>
        <a
          href={`/admin/insights.csv?period=${period}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-50"
        >
          <FileDown className="h-3.5 w-3.5" />
          CSV
        </a>
      </div>

      {/* Period tabs */}
      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
        {VALID_PERIODS.map((p) => {
          const active = p === period;
          return (
            <Link
              key={p}
              href={`/admin/insights?period=${p}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                active ? "bg-violet-600 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {PERIOD_LABELS[p]}
            </Link>
          );
        })}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="診断回数 (合計)" value={fmtNum(totalDiagnose)} accent="text-violet-600" />
        <SummaryCard label="ユニーク対象アカウント" value={fmtNum(uniqueAccounts)} accent="text-indigo-600" />
        <SummaryCard label="LINE 友達追加クリック" value={fmtNum(totalLineClick)} accent="text-emerald-600" />
        <SummaryCard
          label="集団被害候補（≥3名）"
          value={`${fmtNum(highClusterCount + mediumClusterCount)}`}
          accent="text-rose-600"
          hint={
            highClusterCount > 0
              ? `うち高(≥5名): ${highClusterCount}`
              : mediumClusterCount > 0
              ? `中(3-4名)のみ`
              : undefined
          }
        />
      </div>

      {/* Account category breakdown — 業界タグ別内訳 (⑥) */}
      <CategoryBreakdown
        ranking={ranking}
        profiles={profiles}
      />

      {/* 集団被害候補 — 同一加害者に対する複数被害者シグナル (③) */}
      {clusterRows.length > 0 && (
        <section className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 via-white to-amber-50/30 p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <h2 className="text-sm font-extrabold text-rose-900">
              集団被害候補 — 同一アカウントに対する複数被害者シグナル
            </h2>
          </div>
          <p className="mt-1 text-[11px] text-rose-800/70">
            ユニーク Session 数（実質的な異なる診断者数）が 3 以上のアカウントを抜粋。集団訴訟・連名での弁護士相談の余地があります。
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {clusterRows.slice(0, 9).map((row) => {
              const tier = clusterTier(row.uniqueSessions);
              if (tier === "none") return null;
              const style = CLUSTER_STYLE[tier];
              const profile = profiles.get(row.username);
              return (
                <Link
                  key={row.username}
                  href={`/admin/leads?username=${encodeURIComponent(row.username)}`}
                  className={`flex items-center gap-3 rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm transition hover:bg-white`}
                >
                  <Image
                    src={profile?.profileImageUrl ?? `https://unavatar.io/x/${row.username}`}
                    alt={`@${row.username}`}
                    width={36}
                    height={36}
                    className="h-9 w-9 shrink-0 rounded-full object-cover"
                    unoptimized
                  />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5">
                      <span className="truncate font-extrabold">
                        {profile?.displayName?.trim() || `@${row.username}`}
                      </span>
                      <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-extrabold ${style.badgeBg} ${style.badgeText}`}>
                        {style.label}
                      </span>
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      <Users className="mr-0.5 inline h-2.5 w-2.5" />
                      {row.uniqueSessions} 名から診断 / 計 {row.diagnoseCount} 件
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Trend chart */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-violet-500" />
          <h2 className="text-sm font-extrabold">日次推移</h2>
          <span className="ml-auto inline-flex items-center gap-3 text-[11px] font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-3 rounded-full bg-violet-600" /> 診断
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-3 rounded-full bg-[#06c755]" /> LINEクリック
            </span>
          </span>
        </div>
        <div className="mt-3">
          <TrendChart data={trend} />
        </div>
      </section>

      {/* Ranking table */}
      <section>
        <h2 className="text-sm font-extrabold">
          診断回数ランキング ({PERIOD_LABELS[period]})
        </h2>
        <p className="mt-1 text-[11px] text-slate-500">
          上位50件まで表示。同一 X アカウントへの診断は大文字小文字を区別せずに集計します。
        </p>
        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">#</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">Xアカウント</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">診断回数</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">ユニークSession</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">LINEクリック</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">フォロワー</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">初回</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">直近</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {ranking.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                      この期間の診断データはありません。
                    </td>
                  </tr>
                ) : (
                  ranking.map((row, i) => (
                    <RankRow
                      key={row.username}
                      idx={i + 1}
                      row={row}
                      profile={profiles.get(row.username)}
                      tier={clusterTier(row.uniqueSessions)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
  hint,
}: {
  label: string;
  value: string;
  accent: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold tracking-tight ${accent}`}>{value}</p>
      {hint && <p className="mt-0.5 text-[10px] text-slate-500">{hint}</p>}
    </div>
  );
}

function RankRow({
  idx,
  row,
  profile,
  tier,
}: {
  idx: number;
  row: DiagnoseRankRow;
  profile: XProfileSnapshot | undefined;
  tier: ClusterTier;
}) {
  const handle = row.username;
  const display = profile?.displayName?.trim() || `@${handle}`;
  const avatar = profile?.profileImageUrl ?? `https://unavatar.io/x/${handle}`;
  const cluster = tier !== "none" ? CLUSTER_STYLE[tier] : null;
  const cat = classifyAccount(profile);

  return (
    <tr className={`border-t border-slate-100 ${cluster?.rowBg ?? ""}`}>
      <td className="px-4 py-3 font-mono text-slate-400">{idx}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Image
            src={avatar}
            alt={`@${handle}`}
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover"
            unoptimized
          />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5">
              <span className="truncate font-extrabold">{display}</span>
              <span
                className={`rounded-md px-1.5 py-0.5 text-[9px] font-extrabold ${cat.badgeBg} ${cat.badgeText}`}
                title={`${cat.label}: ${cat.criterion}`}
              >
                {cat.label}
              </span>
              {cluster && (
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[9px] font-extrabold ${cluster.badgeBg} ${cluster.badgeText}`}
                >
                  {cluster.label}
                </span>
              )}
            </p>
            <p className="truncate font-mono text-[11px] text-slate-500">@{handle}</p>
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm font-extrabold text-violet-700">
        {fmtNum(row.diagnoseCount)}
      </td>
      <td
        className={`whitespace-nowrap px-4 py-3 ${
          tier === "high"
            ? "font-extrabold text-rose-600"
            : tier === "medium"
            ? "font-bold text-amber-700"
            : "text-slate-600"
        }`}
      >
        {fmtNum(row.uniqueSessions)}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-emerald-600">{fmtNum(row.lineClickCount)}</td>
      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{fmtNum(profile?.followers ?? null)}</td>
      <td className="whitespace-nowrap px-4 py-3 text-slate-500">{fmtJst(row.firstAt)}</td>
      <td className="whitespace-nowrap px-4 py-3 text-slate-500">{fmtJst(row.lastAt)}</td>
      <td className="whitespace-nowrap px-4 py-3 text-right">
        <Link
          href={`/admin/leads?username=${encodeURIComponent(handle)}`}
          className="text-violet-600 hover:underline"
        >
          詳細→
        </Link>
      </td>
    </tr>
  );
}

// ============================================================
// 業界タグ（属性分類）— ⑥
// ============================================================
type AccountCategoryKey = "government" | "business" | "macro" | "mid" | "micro" | "individual";

interface AccountCategory {
  key: AccountCategoryKey;
  label: string;
  /** 自動判定の基準 (UI に表示) */
  criterion: string;
  /** どんな営業先に使えるか (UI のヘルプ) */
  useCase: string;
  badgeBg: string;
  badgeText: string;
}

const CATEGORY_DEFS: Record<AccountCategoryKey, AccountCategory> = {
  government: {
    key: "government",
    label: "政府/公共",
    criterion: "X 政府認証バッジあり",
    useCase: "省庁・自治体・公的機関アカウント",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-700",
  },
  business: {
    key: "business",
    label: "企業公式",
    criterion: "X ビジネス認証バッジあり",
    useCase: "企業広報・PR会社向けの誹謗中傷モニタリング営業先",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-700",
  },
  macro: {
    key: "macro",
    label: "マクロ (大型)",
    criterion: "フォロワー 10万人以上",
    useCase: "芸能人・大型インフルエンサー。タレント事務所/マネジメントへの営業先",
    badgeBg: "bg-rose-100",
    badgeText: "text-rose-700",
  },
  mid: {
    key: "mid",
    label: "ミドル",
    criterion: "フォロワー 1万〜10万人",
    useCase: "中堅インフルエンサー・タレント。賠償額が見込みやすい層",
    badgeBg: "bg-violet-100",
    badgeText: "text-violet-700",
  },
  micro: {
    key: "micro",
    label: "マイクロ",
    criterion: "フォロワー 1千〜1万人",
    useCase: "小規模インフルエンサー・地域有名人",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
  },
  individual: {
    key: "individual",
    label: "個人",
    criterion: "フォロワー 1千人未満 または不明",
    useCase: "一般ユーザー。被害者本人として相談に来るケースが多い層",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-600",
  },
};

function classifyAccount(profile: XProfileSnapshot | undefined): AccountCategory {
  if (profile?.verifiedType === "government") return CATEGORY_DEFS.government;
  if (profile?.verifiedType === "business")   return CATEGORY_DEFS.business;
  const f = profile?.followers ?? 0;
  if (f >= 100_000) return CATEGORY_DEFS.macro;
  if (f >= 10_000)  return CATEGORY_DEFS.mid;
  if (f >= 1_000)   return CATEGORY_DEFS.micro;
  return CATEGORY_DEFS.individual;
}

function CategoryBreakdown({
  ranking,
  profiles,
}: {
  ranking: DiagnoseRankRow[];
  profiles: Map<string, XProfileSnapshot>;
}) {
  // Aggregate diagnose counts per category
  const buckets = new Map<AccountCategoryKey, { meta: AccountCategory; accounts: number; diagnoses: number }>();
  for (const r of ranking) {
    const cat = classifyAccount(profiles.get(r.username));
    const entry = buckets.get(cat.key) ?? { meta: cat, accounts: 0, diagnoses: 0 };
    entry.accounts += 1;
    entry.diagnoses += r.diagnoseCount;
    buckets.set(cat.key, entry);
  }
  const order: AccountCategoryKey[] = ["government", "business", "macro", "mid", "micro", "individual"];
  const list = order
    .map((k) => buckets.get(k))
    .filter((x): x is { meta: AccountCategory; accounts: number; diagnoses: number } => Boolean(x));
  const totalDiagnoses = list.reduce((acc, x) => acc + x.diagnoses, 0);

  if (list.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-violet-500" />
        <h2 className="text-sm font-extrabold">業界タグ別内訳</h2>
        <span className="ml-auto text-[10px] text-slate-500">
          フォロワー数と認証タイプで自動分類（※ 簡易判定）
        </span>
      </div>
      <p className="mt-1 text-[11px] text-slate-500">
        企業公式・タレント・大型インフルエンサー等の構成を可視化。法律事務所以外（PR会社・タレント事務所・企業広報）への営業材料に使えます。
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {list.map((b) => (
          <div
            key={b.meta.key}
            className="rounded-xl border border-slate-100 bg-slate-50/60 p-3"
            title={b.meta.useCase}
          >
            <p className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${b.meta.badgeBg} ${b.meta.badgeText}`}>
              {b.meta.label}
            </p>
            <p className="mt-1 text-[10px] leading-tight text-slate-500">{b.meta.criterion}</p>
            <p className="mt-2 text-lg font-extrabold tracking-tight text-slate-800">
              {fmtNum(b.diagnoses)}
              <span className="ml-1 text-[10px] font-bold text-slate-500">件</span>
            </p>
            <p className="text-[10px] text-slate-500">
              {fmtNum(b.accounts)} アカウント
              {totalDiagnoses > 0 && (
                <span className="ml-1">/ {Math.round((b.diagnoses / totalDiagnoses) * 100)}%</span>
              )}
            </p>
          </div>
        ))}
      </div>

      {/* All-categories legend — 該当が無いカテゴリも含めて凡例として表示 */}
      <details className="mt-3 rounded-xl border border-slate-100 bg-white p-3 text-[11px]">
        <summary className="cursor-pointer font-bold text-slate-600">
          全カテゴリの定義を見る
        </summary>
        <ul className="mt-2 space-y-1.5">
          {(["government", "business", "macro", "mid", "micro", "individual"] as AccountCategoryKey[]).map((k) => {
            const c = CATEGORY_DEFS[k];
            return (
              <li key={k} className="flex flex-wrap items-baseline gap-2">
                <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${c.badgeBg} ${c.badgeText}`}>
                  {c.label}
                </span>
                <span className="font-mono text-[10px] text-slate-500">{c.criterion}</span>
                <span className="text-slate-600">— {c.useCase}</span>
              </li>
            );
          })}
        </ul>
      </details>
    </section>
  );
}
