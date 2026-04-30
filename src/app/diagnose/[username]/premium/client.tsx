"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  AlertTriangle,
  MessageSquareWarning,
  ShieldAlert,
  Eye,
  User,
  Clock,
  Download,
  FileText,
  MessageCircle,
  Scale,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  Loader2,
  BadgeCheck,
  Brain,
  Activity,
  Hash,
  FileJson,
  TableProperties,
} from "lucide-react";
import type { DiagnosisData, ClassifiedTweet, Severity, Level, CategoryName } from "@/lib/diagnose-types";
import { AccountProfileCard } from "@/components/account-profile";
import { AccountAnalysisCard } from "@/components/account-analysis";
import { LineGateOverlay, isLineVerifiedClient } from "@/components/line-gate";

// ============================================================
// Local UI building blocks (mirrors the diagnose result page)
// ============================================================
const levelConfig: Record<
  Level,
  { label: string; color: string; gradient: string; desc: string }
> = {
  S: { label: "極めて高い", color: "text-red-600",     gradient: "from-red-500 to-rose-600",    desc: "専門家への相談を検討する材料となります。" },
  A: { label: "かなり高い", color: "text-orange-600",  gradient: "from-orange-400 to-orange-500", desc: "複数の法令に抵触する可能性があります。" },
  B: { label: "高い",       color: "text-amber-600",   gradient: "from-amber-400 to-amber-500",  desc: "法的措置の対象となりうる投稿が見つかりました。" },
  C: { label: "やや高い",   color: "text-yellow-600",  gradient: "from-yellow-400 to-yellow-500", desc: "問題のある投稿がいくつか見つかりました。" },
  D: { label: "低い",       color: "text-blue-600",    gradient: "from-blue-400 to-blue-500",    desc: "注意が必要な投稿が一部あります。" },
  E: { label: "非常に低い", color: "text-emerald-600", gradient: "from-emerald-400 to-emerald-500", desc: "法的に問題のある投稿はほとんどありません。" },
};

const CATEGORY_META: Record<CategoryName, { icon: typeof AlertTriangle; color: string; bg: string }> = {
  "名誉毀損":         { icon: AlertTriangle,        color: "text-red-500",    bg: "bg-red-50" },
  "侮辱":             { icon: MessageSquareWarning, color: "text-amber-500",  bg: "bg-amber-50" },
  "脅迫":             { icon: ShieldAlert,          color: "text-violet-500", bg: "bg-violet-50" },
  "プライバシー侵害": { icon: Eye,                  color: "text-blue-500",   bg: "bg-blue-50" },
};

const severityStyle: Record<Severity, { label: string; bg: string; text: string; border: string; dot: string }> = {
  high:   { label: "高", bg: "bg-red-100",   text: "text-red-700",   border: "border-red-200",   dot: "bg-red-400" },
  medium: { label: "中", bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-400" },
  low:    { label: "低", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200", dot: "bg-slate-400" },
};

function Avatar({ username, size = 48 }: { username: string; size?: number }) {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <div className="flex items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-indigo-100" style={{ width: size, height: size }}>
        <User className="text-violet-400" style={{ width: size * 0.45, height: size * 0.45 }} />
      </div>
    );
  }
  return (
    <Image
      src={`https://unavatar.io/x/${username}`}
      alt={`@${username}`}
      width={size}
      height={size}
      className="rounded-full object-cover ring-2 ring-white shadow-md"
      onError={() => setErr(true)}
      unoptimized
    />
  );
}

function ScoreRing({ score, size: SIZE = 124 }: { score: number; size?: number }) {
  const STROKE = 9;
  const radius = (SIZE - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
      <svg className="absolute -rotate-90" width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={STROKE} />
        <circle cx={SIZE / 2} cy={SIZE / 2} r={radius} fill="none" stroke="url(#prScoreGrad)" strokeWidth={STROKE}
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.5s ease-out" }} />
        <defs>
          <linearGradient id="prScoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center text-white">
        <p className="text-4xl font-black leading-none tracking-tight">{score}</p>
        <p className="mt-0.5 text-[10px] font-semibold tracking-wider text-slate-500">/100</p>
      </div>
    </div>
  );
}

const EMOTION_META: Record<string, { label: string; color: string; bg: string }> = {
  anger:    { label: "怒り",   color: "bg-red-500",     bg: "bg-red-100" },
  contempt: { label: "侮蔑",   color: "bg-amber-500",   bg: "bg-amber-100" },
  mockery:  { label: "嘲笑",   color: "bg-violet-500",  bg: "bg-violet-100" },
  threat:   { label: "脅威",   color: "bg-rose-600",    bg: "bg-rose-100" },
  sadness:  { label: "悲哀",   color: "bg-blue-500",    bg: "bg-blue-100" },
};

// ============================================================
// CSV / JSON export helpers (client-side download)
// ============================================================
function downloadBlob(filename: string, mime: string, content: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportEvidenceCsv(username: string, data: import("@/lib/diagnose-types").DiagnosisData) {
  const header = [
    "id", "tweet_id", "category", "severity", "applicable_law", "emotion",
    "created_at", "captured_at", "likes", "rt", "reply", "text", "tags", "reasoning", "sha256",
  ];
  const rows = (data.evidence ?? []).map((ev, i) => [
    i + 1, ev.tweet_id, ev.category, ev.severity, ev.applicable_law, ev.emotion ?? "",
    ev.created_at, ev.capturedAt ?? "",
    ev.metrics.likes, ev.metrics.rt, ev.metrics.reply,
    ev.text.replace(/"/g, '""').replace(/\r?\n/g, " "),
    ev.tags.join("; "),
    (ev.reasoning ?? "").replace(/"/g, '""').replace(/\r?\n/g, " "),
    ev.hash ?? "",
  ]);
  const csv = "\ufeff" + [header, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  downloadBlob(`evidence_${username}_${Date.now()}.csv`, "text/csv;charset=utf-8;", csv);
}

function exportEvidenceJson(username: string, data: import("@/lib/diagnose-types").DiagnosisData) {
  downloadBlob(
    `evidence_${username}_${Date.now()}.json`,
    "application/json;charset=utf-8;",
    JSON.stringify(data, null, 2),
  );
}

const TEMPLATES = [
  { title: "発信者情報開示請求書（参考フォーマット）", desc: "公的書式に基づく記入欄付き参考フォーマット。", size: "HTML" },
];

// ============================================================
// Main component
// ============================================================
export function PremiumClient({ username }: { username: string }) {
  const [data, setData] = useState<DiagnosisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  // LINE gate: プレミアムコンテンツは LINE ゲート通過ユーザーのみに開放する。
  // null = 判定中（SSR 直後）, true/false = 判定済み
  // SSR では必ず null、CSR 側の最初の render 以降は lazy init で一発判定。
  const [lineVerified, setLineVerified] = useState<boolean | null>(() =>
    typeof window === "undefined" ? null : isLineVerifiedClient(),
  );

  // Cookie はタブをまたいだ外部イベントで変わる可能性があるので、
  // 戻ってきたときに再評価する (setState-in-effect ではなく外部イベント購読)。
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onVisibility = () => {
      const next = isLineVerifiedClient();
      setLineVerified((prev) => (prev === next ? prev : next));
    };
    window.addEventListener("visibilitychange", onVisibility);
    return () => window.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/diagnose/${encodeURIComponent(username)}`);
        const json = (await res.json()) as { ok: boolean; data?: DiagnosisData; error?: string };
        if (cancelled) return;
        if (json.ok && json.data) {
          setData(json.data);
        } else {
          setError(json.error ?? "分析結果を取得できませんでした");
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "通信エラー");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);

  // ===== LINE gate =====
  // 登録済みでないユーザーはフルスクリーンの LINE 誘導だけを表示する。
  // lineVerified === null の間はローディング扱い（チラつき防止）。
  if (lineVerified === false) {
    return <LineGateOverlay username={username} />;
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5 text-center">
        <div>
          <p className="text-base font-extrabold">読み込みに失敗しました</p>
          <p className="mt-2 text-sm text-text-muted">{error}</p>
          <a href={`/diagnose/${username}`} className="mt-4 inline-block rounded-xl border border-border px-4 py-2 text-sm font-bold">
            診断ページに戻る
          </a>
        </div>
      </div>
    );
  }

  if (lineVerified === null || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-violet-50/40 via-white to-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-violet-500" />
          <p className="mt-3 text-sm font-bold text-text-sub">プレミアムレポートを読み込み中…</p>
        </div>
      </div>
    );
  }

  const lc = levelConfig[data.level];
  const evidence = data.evidence ?? [];
  const problemRate = data.totalPosts > 0 ? ((data.problemPosts / data.totalPosts) * 100).toFixed(1) : "0.0";

  return (
    <div className="min-h-screen bg-surface">
      {/* ===== Top bar ===== */}
      <div className="safe-pt sticky top-0 z-40 border-b border-border bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-12 sm:h-14 max-w-2xl items-center justify-between px-3 sm:px-5">
          <a href={`/diagnose/${username}`} className="flex items-center gap-1.5 text-sm text-text-sub hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            戻る
          </a>
          <div className="flex items-center gap-1.5">
            <Image src="/logo_icon.png" alt="ロゴ" width={22} height={22} />
            <span className="text-sm font-extrabold">開示請求<span className="text-gradient-blue">診断</span></span>
          </div>
          <span className="inline-flex h-8 items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 text-[11px] font-bold text-violet-700">
            <Sparkles className="h-3 w-3" />
            PRO
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-5 py-6 sm:py-8">
        {/* ===== 1. Verdict Hero (matches diagnose result page) ===== */}
        <div className="animate-bounce-in overflow-hidden rounded-3xl bg-gradient-to-br from-[#10102a] via-[#141438] to-[#1a1a45] p-5 sm:p-7 text-white">
          {/* Top row: user + level badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar username={data.username} size={44} />
              <div>
                <p className="text-base font-extrabold leading-tight">@{data.username}</p>
                <p className="text-xs text-slate-500">{new Date().toLocaleDateString("ja-JP")}</p>
              </div>
            </div>
            <span className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${lc.gradient} text-2xl font-black shadow-lg shadow-black/20`}>
              {data.level}
            </span>
          </div>

          {/* LINE unlocked ribbon */}
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#06c755]/40 bg-[#06c755]/15 px-3 py-1 text-[11px] font-bold text-[#06c755]">
            <BadgeCheck className="h-3 w-3" />
            LINE登録済 — 全件レポート閲覧可
          </div>

          {/* Score + Level */}
          <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
            <div className="shrink-0">
              <ScoreRing score={data.score} />
            </div>
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">開示請求レベル</p>
              <p className={`mt-1 text-3xl sm:text-4xl font-black leading-tight tracking-tight ${lc.color}`}>{lc.label}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{lc.desc}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-2">
            {[
              { value: data.totalPosts, label: "分析投稿", color: "text-blue-300" },
              { value: data.problemPosts, label: "問題投稿", color: "text-red-300" },
              { value: `${problemRate}%`, label: "問題率", color: "text-amber-300" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-white/[0.05] px-3 py-3 text-center">
                <p className={`text-xl font-black tracking-tight ${s.color}`}>{s.value}</p>
                <p className="mt-1 text-[10px] font-medium text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Data source / freshness */}
          <p className="mt-4 text-center text-[10px] leading-relaxed text-slate-500">
            ※ X API v2 で取得した直近最大 100 件（RT 除く）が分析対象です。
            {data.source === "x-api+claude" && data.analyzedAt && (
              <> 取得時刻: {new Date(data.analyzedAt).toLocaleString("ja-JP")}（キャッシュ 24h）</>
            )}
            {data.source === "mock" && <> ※ これはサンプル表示です。実アカウントは分析していません。</>}
          </p>
        </div>

        {/* ===== 1.5 PREMIUM — AI総合レポート ===== */}
        {data.aiSummary && (
          <div className="mt-5 overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-indigo-50 to-white p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg shadow-violet-500/30">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-violet-600">AI ANALYSIS REPORT</p>
                <p className="text-[15px] font-extrabold tracking-tight">AI総合レポート</p>
              </div>
              <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-violet-200 bg-white/70 px-2.5 py-1 text-[10px] font-bold text-violet-700">
                <Sparkles className="h-2.5 w-2.5" />
                PREMIUM
              </span>
            </div>
            <p className="mt-4 rounded-2xl bg-white px-4 py-4 text-[13px] leading-relaxed text-foreground shadow-sm">
              {data.aiSummary}
            </p>
            <p className="mt-2 text-[10px] text-text-muted">
              ※ AIによる観察結果のサマリーです。法的判断ではありません
            </p>
          </div>
        )}

        {/* ===== 1.6 PREMIUM — Emotion profile ===== */}
        {data.emotionProfile && (
          <div className="mt-5 rounded-2xl border border-border bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-violet-600">EMOTION PROFILE</p>
                <h3 className="mt-0.5 text-base sm:text-lg font-extrabold tracking-tight">感情プロファイル</h3>
              </div>
              <span className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-bold text-violet-600">
                AI判定
              </span>
            </div>
            <p className="mt-1 text-[11px] text-text-muted">
              問題投稿の投稿文面に現れる表現を 5 軸で分類・集計した結果です（心理学的診断ではなく文面上の AI 分類）。
            </p>
            <div className="mt-4 space-y-2.5">
              {(["anger", "contempt", "mockery", "threat", "sadness"] as const).map((key) => {
                const meta = EMOTION_META[key];
                const value = data.emotionProfile?.[key] ?? 0;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-12 shrink-0 text-[12px] font-bold text-text-sub">{meta.label}</span>
                    <div className={`flex-1 h-3 overflow-hidden rounded-full ${meta.bg}`}>
                      <div
                        className={`h-full rounded-full ${meta.color} animate-fill-bar`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <span className="w-10 shrink-0 text-right text-[13px] font-extrabold tabular-nums text-text-sub">
                      {value}<span className="text-[10px] font-medium">%</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== 1.7 PREMIUM — Time heatmap ===== */}
        {data.timeHeatmap && (
          <div className="mt-5 rounded-2xl border border-border bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-violet-600">TIME HEATMAP</p>
                <h3 className="mt-0.5 text-base sm:text-lg font-extrabold tracking-tight">投稿時間帯ヒートマップ</h3>
              </div>
              <Activity className="h-5 w-5 text-violet-500" />
            </div>
            <p className="mt-1 text-[11px] text-text-muted">
              分析対象: 取得できた直近 {data.analysis.analyzedPosts} 件（約 {data.analysis.analyzedDays} 日分）。色が濃いほど投稿が多い曜日・時間帯
            </p>
            <Heatmap grid={data.timeHeatmap} />
          </div>
        )}

        {/* ===== 2. Categories — same as result ===== */}
        <div className="mt-5 rounded-2xl border border-border bg-white p-5 sm:p-6">
          <h3 className="text-base sm:text-lg font-extrabold tracking-tight">該当する可能性のある法令</h3>
          <p className="mt-1.5 text-xs text-text-muted">※ 当サービスによる独自分類であり、法的判断ではありません</p>
          <div className="mt-5 space-y-4">
            {data.categories.map((cat) => {
              const meta = CATEGORY_META[cat.name];
              const pct = data.problemPosts > 0 ? (cat.count / data.problemPosts) * 100 : 0;
              return (
                <div key={cat.name} className="flex items-center gap-3.5">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${meta.bg}`}>
                    <meta.icon className={`h-5 w-5 ${meta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-bold">{cat.name}</span>
                      <span className={`font-black ${meta.color}`}>
                        <span className="text-xl tracking-tight">{cat.count}</span>
                        <span className="ml-0.5 text-xs">件</span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full animate-fill-bar"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: meta.color.includes("red")
                            ? "#fca5a5"
                            : meta.color.includes("amber")
                            ? "#fcd34d"
                            : meta.color.includes("violet")
                            ? "#c4b5fd"
                            : "#93c5fd",
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== 3. Behavior data — same as result ===== */}
        <div className="mt-5 rounded-2xl border border-border bg-white p-5 sm:p-6">
          <h3 className="text-base sm:text-lg font-extrabold tracking-tight">投稿行動データ</h3>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-border bg-surface p-3 sm:p-4 text-center">
              <p className="text-[10px] font-medium text-text-muted">作成日</p>
              <p className="mt-1 text-sm sm:text-base font-extrabold tracking-tight">{data.profile.accountCreated}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3 sm:p-4 text-center">
              <p className="text-[10px] font-medium text-text-muted">リプライ率</p>
              <p className="mt-1 text-lg sm:text-xl font-black tracking-tight text-indigo-600">
                {data.replyRatio}<span className="text-xs">%</span>
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3 sm:p-4 text-center">
              <p className="text-[10px] font-medium text-text-muted">問題投稿率</p>
              <p className="mt-1 text-lg sm:text-xl font-black tracking-tight text-red-500">
                {problemRate}<span className="text-xs">%</span>
              </p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs font-bold text-text-sub">問題投稿の月別件数</p>
            <div className="mt-3 flex items-end gap-3 h-24">
              {data.monthlyProblemPosts.map((point, i) => {
                const maxCount = Math.max(...data.monthlyProblemPosts.map((p) => p.count));
                return (
                  <div key={point.month} className="flex flex-1 flex-col items-center gap-1.5">
                    <span className="text-sm font-extrabold text-text-sub">{point.count}</span>
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-violet-400 to-indigo-300 animate-fill-bar"
                      style={{
                        height: `${maxCount > 0 ? (point.count / maxCount) * 64 : 6}px`,
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                    <span className="text-xs text-text-muted">{point.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {data.mentionedUsers.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-bold text-text-sub">リプライ・メンション先（上位）</p>
              <div className="mt-3 space-y-2.5">
                {data.mentionedUsers.map((u) => {
                  const max = data.mentionedUsers[0].count;
                  return (
                    <div key={u.handle} className="flex items-center gap-3">
                      <span className="w-20 sm:w-24 shrink-0 truncate text-sm font-bold text-text-sub">@{u.handle}</span>
                      <div className="flex-1 h-2.5 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-full rounded-full bg-indigo-300 animate-fill-bar"
                          style={{ width: `${(u.count / max) * 100}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-sm font-extrabold text-text-sub">
                        {u.count}<span className="text-[10px] font-medium ml-0.5">回</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {data.hostileKeywords.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-bold text-text-sub">固定辞書に一致した語（出現回数）</p>
              <p className="mt-0.5 text-[10px] text-text-muted">
                ※ 単純な部分一致のため、文脈次第で誤検知の可能性があります
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {data.hostileKeywords.map((kw) => (
                  <span
                    key={kw.word}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-bold text-text-sub"
                  >
                    {kw.word}
                    <span className="text-base font-black text-violet-600">{kw.count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ===== 4. PREMIUM — Data export ===== */}
        <div className="mt-5 rounded-2xl border border-border bg-white p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30">
              <Download className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-600">DATA EXPORT</p>
              <p className="text-[15px] font-extrabold tracking-tight">弁護士に渡せる形式でダウンロード</p>
            </div>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-text-sub">
            検出された全投稿に <strong>SHA-256データ整合性ハッシュ</strong> と <strong>取得時刻</strong> を付与した、
            取得時点のスナップショットをダウンロードできます。
          </p>
          <p className="mt-1.5 text-[10.5px] leading-relaxed text-text-muted">
            ※ ハッシュは「当社が取得した時点のデータが、その後改変されていないこと」を内部検証する用途です。
            法的証拠能力を持つタイムスタンプ認証（TSA）は今後対応予定。
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button
              onClick={() => exportEvidenceCsv(data.username, data)}
              className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-[13px] font-extrabold text-text-sub active:scale-[0.97]"
            >
              <TableProperties className="h-4 w-4 text-emerald-600" />
              CSV
            </button>
            <button
              onClick={() => exportEvidenceJson(data.username, data)}
              className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-[13px] font-extrabold text-text-sub active:scale-[0.97]"
            >
              <FileJson className="h-4 w-4 text-blue-600" />
              JSON
            </button>
          </div>
        </div>

        {/* ===== 5. PREMIUM — Full evidence list ===== */}
        <div className="mt-5">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-600">PREMIUM</p>
              <h3 className="mt-1 text-base sm:text-lg font-extrabold tracking-tight">検出された投稿 全{evidence.length}件</h3>
              <p className="mt-0.5 text-[10.5px] text-text-muted">
                各投稿に SHA-256 データ整合性ハッシュ & 取得時刻を付与
              </p>
            </div>
          </div>

          {evidence.length === 0 ? (
            <p className="rounded-2xl border border-border bg-white px-4 py-8 text-center text-sm text-text-muted">
              問題のある投稿は検出されませんでした
            </p>
          ) : (
            <div className="space-y-3">
              {evidence.map((ev, idx) => (
                <EvidenceCard key={ev.tweet_id} idx={idx + 1} ev={ev} username={data.username} />
              ))}
            </div>
          )}
        </div>

        {/* ===== 4.5 What happens to them ===== */}
        <div className="mt-5 rounded-2xl border border-border bg-white p-5 sm:p-6">
          <h3 className="text-base sm:text-lg font-extrabold tracking-tight">開示請求すると相手はどうなるか</h3>
          <p className="mt-1.5 text-xs text-text-muted">※ 一般的な法的手続きの流れに基づく情報です</p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              { icon: "👤", label: "身元特定の可能性", desc: "氏名・住所が\nプロバイダから開示される場合", tone: "red" },
              { icon: "💰", label: "慰謝料請求の検討", desc: "名誉毀損で\n30〜100万円（参考相場）", tone: "red" },
              { icon: "🏢", label: "職場・学校への波及", desc: "勤務先や学校に\n事実が伝わる場合", tone: "red" },
              { icon: "⚖️", label: "刑事手続の対象", desc: "侮辱罪は懲役刑あり\n（2022年厳罰化）", tone: "red" },
              { icon: "📄", label: "裁判記録が残る場合", desc: "判決は公開情報\nネットに名前が残ることも", tone: "amber" },
              { icon: "💸", label: "防御費用が発生する場合", desc: "相手側も弁護士を\n雇う必要が生じうる", tone: "amber" },
            ].map((item) => {
              const isRed = item.tone === "red";
              return (
                <div
                  key={item.label}
                  className={`relative overflow-hidden rounded-2xl border p-4 ${
                    isRed
                      ? "border-red-200 bg-gradient-to-br from-red-50 to-rose-50/40"
                      : "border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/40"
                  }`}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/90 text-2xl shadow-sm">
                    {item.icon}
                  </div>
                  <p className={`mt-3 text-base font-extrabold tracking-tight ${isRed ? "text-red-800" : "text-amber-900"}`}>
                    {item.label}
                  </p>
                  <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-text-muted">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 p-4 text-center">
            <p className="text-sm font-extrabold text-indigo-900 leading-relaxed">
              詳細レポートで証拠を整理し、<br className="sm:hidden" />法的対処の検討材料として活用できます
            </p>
          </div>
        </div>

        {/* ===== 4.6 Cost simulation ===== */}
        <div className="mt-5 rounded-2xl border border-border bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base sm:text-lg font-extrabold tracking-tight">開示請求にかかる費用と賠償金の目安</h3>
            <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500">
              参考情報
            </span>
          </div>
          <p className="mt-1.5 text-xs text-text-muted">
            ※ 一般的な市場相場の参考値であり、本診断結果とは別物です。個別事案の費用・賠償額は弁護士にご確認ください。
          </p>

          <div className="mt-5 space-y-2.5">
            <p className="text-xs font-bold text-text-sub">費用の内訳（目安）</p>
            {[
              { label: "発信者情報開示請求（弁護士費用）", range: "20〜40万円" },
              { label: "裁判所手数料・実費", range: "1〜3万円" },
              { label: "損害賠償請求（弁護士費用）", range: "20〜50万円" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl bg-surface px-4 py-3">
                <span className="text-sm text-text-sub flex-1 mr-2">{item.label}</span>
                <span className="text-sm font-extrabold text-text-sub whitespace-nowrap">{item.range}</span>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-4">
              <span className="text-base font-extrabold text-indigo-900">合計費用の目安</span>
              <span className="text-2xl font-black tracking-tight text-indigo-600">40〜90<span className="text-sm">万円</span></span>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs font-bold text-text-sub">勝訴した場合の賠償金相場</p>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {[
                { category: "名誉毀損", range: "30〜100万円", color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
                { category: "侮辱", range: "10〜50万円", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
                { category: "脅迫", range: "30〜100万円", color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100" },
                { category: "プライバシー侵害", range: "10〜80万円", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
              ].map((item) => (
                <div key={item.category} className={`rounded-xl border ${item.border} ${item.bg} p-3.5 text-center`}>
                  <p className="text-xs font-medium text-text-muted">{item.category}</p>
                  <p className={`mt-1 text-base font-black tracking-tight ${item.color}`}>{item.range}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-extrabold text-emerald-900 leading-snug">
              費用対効果は弁護士に相談を
            </p>
            <p className="mt-2 text-xs leading-relaxed text-emerald-700">
              悪質な誹謗中傷の場合、慰謝料に加え弁護士費用・調査費用の一部も相手に請求できる場合があります。
              実際にどの程度の費用対効果が見込めるかは、個別事案により大きく異なるため、必ず弁護士にご確認ください。
            </p>
          </div>

          <p className="mt-4 text-[10px] leading-relaxed text-text-muted">
            出典: 裁判所公開データ・弁護士費用の一般的な相場に基づく目安です。実際の費用・賠償額は弁護士にご確認ください。
          </p>
        </div>

        {/* ===== 5. PREMIUM — PDF templates ===== */}
        <div className="mt-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-600">DOCUMENTS</p>
          <h3 className="mt-1 text-base sm:text-lg font-extrabold tracking-tight">請求書テンプレート（参考フォーマット）</h3>
          <p className="mt-1 text-[12px] text-text-muted">専門家への相談時に活用できる参考フォーマット集</p>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.title}
                className="group flex items-center gap-3 rounded-2xl border border-border bg-white p-4 text-left shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] active:scale-[0.98]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100">
                  <FileText className="h-5 w-5 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[13px] font-extrabold tracking-tight">{tpl.title}</p>
                  <p className="mt-0.5 truncate text-[11px] text-text-muted">{tpl.desc}</p>
                  <p className="mt-1 text-[10px] font-bold text-violet-600">{tpl.size}</p>
                </div>
                <Download className="h-4 w-4 shrink-0 text-text-muted" />
              </button>
            ))}
          </div>
        </div>

        {/* ===== 7. LINE フォローアップ ===== */}
        <div className="mt-8 rounded-2xl border border-[#06c755]/30 bg-gradient-to-br from-[#f0fbf1] to-white p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-[#06c755]" />
            <h3 className="text-base font-extrabold tracking-tight">公式LINEで続報を受け取る</h3>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-text-sub">
            このレポートのフォローアップ・関連情報は、
            公式LINE からそのままお届けします。解約・退会はいつでもトーク画面から可能です。
          </p>
          <div className="mt-4 space-y-2.5">
            {[
              { icon: ShieldCheck, label: "費用", value: "完全無料", color: "text-emerald-500" },
              { icon: CheckCircle2, label: "受け取り方法", value: "公式LINEトーク", color: "text-[#06c755]" },
              { icon: Sparkles, label: "提供内容", value: "レポート / 関連情報", color: "text-violet-500" },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-3">
                <row.icon className={`h-4 w-4 ${row.color}`} />
                <span className="text-[12px] font-bold text-text-sub">{row.label}</span>
                <span className="ml-auto text-[13px] font-extrabold">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ===== 8. Account profile + analysis (de-emphasized, bottom) ===== */}
        <div className="mt-8">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">アカウント情報</p>
          <AccountProfileCard profile={data.profile} />
        </div>
        <div className="mt-5">
          <AccountAnalysisCard analysis={data.analysis} />
        </div>

        {/* ===== Disclaimer ===== */}
        <div className="safe-pb mt-8 rounded-2xl border border-amber-200 bg-amber-50/60 px-4 py-3.5 text-[10.5px] leading-relaxed text-amber-900">
          <p className="font-bold">重要なお知らせ</p>
          <p className="mt-1">
            本サービスはAIによる投稿分類・統計分析のみを提供しており、<strong>法的助言・法律相談・代理行為は一切行いません</strong>。
            投稿の違法性や開示請求の可否についての最終判断は、必ずご自身でお近くの法律事務所等の専門家にご確認ください。
          </p>
          <p className="mt-1.5">
            参考条文の表示はAIによる分類結果であり、該当性を保証するものではありません。
            {data.source === "mock" && " ※現在の表示はデモデータです。"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Heatmap component (7 days × 24 hours)
// ============================================================
function Heatmap({ grid }: { grid: number[][] }) {
  const max = Math.max(1, ...grid.flat());
  const dayLabels = ["日", "月", "火", "水", "木", "金", "土"];
  return (
    <div className="mt-3 w-full">
      {/* Hour ruler */}
      <div className="grid w-full" style={{ gridTemplateColumns: "1.25rem repeat(24, minmax(0, 1fr))", gap: "2px" }}>
        <div />
        {Array.from({ length: 24 }, (_, h) => (
          <div key={h} className="text-center text-[8px] text-text-muted">
            {h % 6 === 0 ? h : ""}
          </div>
        ))}
      </div>
      {grid.map((row, dayIdx) => (
        <div
          key={dayIdx}
          className="mt-[2px] grid w-full items-center"
          style={{ gridTemplateColumns: "1.25rem repeat(24, minmax(0, 1fr))", gap: "2px" }}
        >
          <div className="text-[10px] font-bold text-text-sub">{dayLabels[dayIdx]}</div>
          {row.map((count, hourIdx) => {
            const intensity = count / max;
            const opacity = count === 0 ? 0.06 : 0.25 + intensity * 0.75;
            return (
              <div
                key={hourIdx}
                className="aspect-square w-full rounded-[2px] bg-violet-500"
                style={{ opacity }}
                title={`${dayLabels[dayIdx]}曜 ${hourIdx}時: ${count}件`}
              />
            );
          })}
        </div>
      ))}
      <div className="mt-3 flex items-center gap-1.5 pl-[1.25rem]">
        <span className="text-[9px] text-text-muted">少</span>
        {[0.1, 0.3, 0.5, 0.7, 0.9].map((o) => (
          <div key={o} className="h-2.5 w-2.5 rounded-[2px] bg-violet-500" style={{ opacity: o }} />
        ))}
        <span className="text-[9px] text-text-muted">多</span>
      </div>
    </div>
  );
}

// ============================================================
// Evidence card — one classified problem tweet
// ============================================================
function EvidenceCard({ idx, ev, username }: { idx: number; ev: ClassifiedTweet; username: string }) {
  const sev = severityStyle[ev.severity === "none" ? "low" : ev.severity];
  const id = String(idx).padStart(3, "0");
  const dateStr = new Date(ev.created_at).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const tweetUrl = ev.tweet_id.startsWith("mock_")
    ? "#"
    : `https://x.com/${encodeURIComponent(username)}/status/${ev.tweet_id}`;

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)]">
      <div className="flex items-center gap-2 border-b border-border/70 bg-surface/50 px-4 py-2.5">
        <span className="text-[11px] font-extrabold text-text-muted">#{id}</span>
        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-extrabold ${sev.bg} ${sev.text} ${sev.border}`}>
          {sev.label}
        </span>
        <span className="text-[11px] font-bold text-text-sub">{ev.category}</span>
        {ev.applicable_law && (
          <span
            className="ml-auto inline-flex items-center gap-1 rounded-md bg-violet-50 px-2 py-0.5 text-[10px] font-extrabold text-violet-700"
            title="参考条文（最終的な該当性は弁護士の判断が必要）"
          >
            <Scale className="h-2.5 w-2.5" />
            参考: {ev.applicable_law}
          </span>
        )}
      </div>

      <div className="px-4 py-3.5">
        <div className="flex items-center justify-between text-[10px] font-medium text-text-muted">
          <span>
            <Clock className="mr-1 inline h-3 w-3" />
            {dateStr}
          </span>
          {ev.emotion && (
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${EMOTION_META[ev.emotion]?.bg ?? "bg-slate-100"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${EMOTION_META[ev.emotion]?.color ?? "bg-slate-400"}`} />
              {EMOTION_META[ev.emotion]?.label ?? ev.emotion}
            </span>
          )}
        </div>
        <p className="mt-2 rounded-xl bg-surface px-3.5 py-3 text-[13px] leading-relaxed text-foreground">{ev.text}</p>
        {ev.reasoning && (
          <p className="mt-2 text-[11px] leading-relaxed text-text-muted">
            <span className="font-bold text-text-sub">AI判定根拠:</span> {ev.reasoning}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between text-[11px] text-text-muted">
          <div className="flex items-center gap-3">
            <span>♥ {ev.metrics.likes}</span>
            <span>↻ {ev.metrics.rt}</span>
            <span>↩ {ev.metrics.reply}</span>
          </div>
          {ev.tags.length > 0 && (
            <div className="flex flex-wrap items-center justify-end gap-1.5">
              {ev.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-border bg-white px-1.5 py-0.5 text-[10px] font-bold text-text-sub"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        {ev.hash && (
          <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/50 px-2.5 py-1.5">
            <p className="flex items-center gap-1 text-[9px] font-bold text-emerald-700">
              <Hash className="h-2.5 w-2.5" />
              データ整合性ハッシュ (SHA-256)
            </p>
            <p className="mt-0.5 break-all font-mono text-[9px] text-emerald-800">{ev.hash}</p>
            {ev.capturedAt && (
              <p className="mt-0.5 text-[9px] text-emerald-700">
                取得時刻: {new Date(ev.capturedAt).toLocaleString("ja-JP")}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-border/70 bg-surface/30">
        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 py-3 text-[11px] font-bold text-text-sub hover:bg-surface"
        >
          <ExternalLink className="h-3.5 w-3.5 text-blue-500" />
          X で原文を見る
        </a>
      </div>
    </article>
  );
}

