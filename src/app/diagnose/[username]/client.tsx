"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Share2,
  AlertTriangle,
  MessageSquareWarning,
  ShieldAlert,
  Eye,
  FileText,
  User,
  UserSearch,
  Clock,
  ChevronRight,
  Coins,
  Building2,
  Gavel,
  Scroll,
  PiggyBank,
  type LucideIcon,
} from "lucide-react";
import { AccountProfileCard } from "@/components/account-profile";
import { AccountAnalysisCard } from "@/components/account-analysis";
import { LineGateCard } from "@/components/line-gate";
import { AttributionCapture } from "@/components/attribution-capture";
import { parseUsername } from "@/lib/parse-username";
import type { DiagnosisData, CategoryName } from "@/lib/diagnose-types";

// Map category names → icon/color metadata for the client UI.
// (The API returns category names only; the client hydrates icons.)
const CATEGORY_META: Record<CategoryName, { icon: typeof AlertTriangle; color: string; bg: string; border: string }> = {
  "名誉毀損":         { icon: AlertTriangle,        color: "text-red-500",    bg: "bg-red-50",    border: "border-red-100" },
  "侮辱":             { icon: MessageSquareWarning, color: "text-amber-500",  bg: "bg-amber-50",  border: "border-amber-100" },
  "脅迫":             { icon: ShieldAlert,          color: "text-violet-500", bg: "bg-violet-50", border: "border-violet-100" },
  "プライバシー侵害": { icon: Eye,                  color: "text-blue-500",   bg: "bg-blue-50",   border: "border-blue-100" },
};

/** Convert the JSON-safe DiagnosisData from the API into the icon-rich shape the UI expects. */
function hydrateDiagnosis(data: DiagnosisData): DiagnosisResult {
  return {
    ...data,
    categories: data.categories.map((c) => ({
      name: c.name,
      count: c.count,
      ...CATEGORY_META[c.name],
    })),
  } as DiagnosisResult;
}

// ============================================================
// Types — DiagnosisData のフィールドに icons を後付けしたもの
// ============================================================
type Level = "S" | "A" | "B" | "C" | "D" | "E";

interface DiagnosisResult extends Omit<DiagnosisData, "categories"> {
  categories: {
    name: string;
    count: number;
    icon: typeof AlertTriangle;
    color: string;
    bg: string;
    border: string;
  }[];
}

// ============================================================
// Level config
// ============================================================
const levelConfig: Record<
  Level,
  { label: string; color: string; gradient: string; bg: string; border: string; textBg: string; desc: string }
> = {
  S: { label: "極めて高い", color: "text-red-600", gradient: "from-red-500 to-rose-600", bg: "bg-red-50", border: "border-red-200", textBg: "bg-red-600", desc: "即座に証拠保全と法的対応の検討を推奨します。" },
  A: { label: "かなり高い", color: "text-orange-600", gradient: "from-orange-400 to-orange-500", bg: "bg-orange-50", border: "border-orange-200", textBg: "bg-orange-500", desc: "複数の法令に抵触する可能性があります。" },
  B: { label: "高い", color: "text-amber-600", gradient: "from-amber-400 to-amber-500", bg: "bg-amber-50", border: "border-amber-200", textBg: "bg-amber-500", desc: "法的措置の対象となりうる投稿が見つかりました。" },
  C: { label: "やや高い", color: "text-yellow-600", gradient: "from-yellow-400 to-yellow-500", bg: "bg-yellow-50", border: "border-yellow-200", textBg: "bg-yellow-500", desc: "問題のある投稿がいくつか見つかりました。" },
  D: { label: "低い", color: "text-blue-600", gradient: "from-blue-400 to-blue-500", bg: "bg-blue-50", border: "border-blue-200", textBg: "bg-blue-500", desc: "注意が必要な投稿が一部あります。" },
  E: { label: "非常に低い", color: "text-emerald-600", gradient: "from-emerald-400 to-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200", textBg: "bg-emerald-500", desc: "法的に問題のある投稿はほとんどありません。" },
};

const severityConfig = {
  high: { label: "重大", color: "text-red-600", bg: "bg-red-50", border: "border-red-100", dot: "bg-red-400" },
  medium: { label: "中程度", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", dot: "bg-amber-400" },
  low: { label: "軽度", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", dot: "bg-blue-400" },
};

// ============================================================
// Avatar component
// ============================================================
function Avatar({ username, size = 48 }: { username: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const src = `https://unavatar.io/x/${username}`;
  if (imgError) {
    return (
      <div className="flex items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-indigo-100" style={{ width: size, height: size }}>
        <User className="text-violet-400" style={{ width: size * 0.45, height: size * 0.45 }} />
      </div>
    );
  }
  return (
    <Image src={src} alt={`@${username}`} width={size} height={size}
      className="rounded-full object-cover ring-2 ring-white shadow-md"
      onError={() => setImgError(true)} unoptimized />
  );
}

// ============================================================
// Score ring (SVG circular gauge)
// ============================================================
function ScoreRing({ score, size: SIZE = 124 }: { score: number; size?: number }) {
  const STROKE = 9;
  const radius = (SIZE - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
      <svg className="absolute -rotate-90" width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={STROKE} />
        <circle cx={SIZE / 2} cy={SIZE / 2} r={radius} fill="none" stroke="url(#scoreGrad)" strokeWidth={STROKE}
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.5s ease-out" }} />
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center">
        <p className="text-4xl font-black leading-none tracking-tight">{score}</p>
        <p className="mt-0.5 text-[10px] font-semibold tracking-wider text-slate-500">/100</p>
      </div>
    </div>
  );
}

// ============================================================
// Component
// ============================================================
export function DiagnoseClient({ username }: { username: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<"loading" | "result" | "error">("loading");
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState("");

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();

    (async () => {
      let hydrated: DiagnosisResult | null = null;
      let fetchError: string | null = null;

      try {
        const res = await fetch(`/api/diagnose/${encodeURIComponent(username)}`);
        const json = (await res.json()) as { ok: boolean; data?: DiagnosisData; error?: string };
        if (json.ok && json.data) {
          hydrated = hydrateDiagnosis(json.data);
        } else {
          fetchError = json.error ?? "診断結果を取得できませんでした";
        }
      } catch (err) {
        fetchError = err instanceof Error ? err.message : "通信エラー";
      }

      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, 2500 - elapsed);
      setTimeout(() => {
        if (cancelled) return;
        if (hydrated) {
          setResult(hydrated);
          setPhase("result");
        } else {
          setErrorMsg(fetchError);
          setPhase("error");
        }
      }, remaining);
    })();

    return () => {
      cancelled = true;
    };
  }, [username]);

  const handleNewSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = parseUsername(newUsername);
    if (cleaned) {
      setPhase("loading");
      setResult(null);
      router.push(`/diagnose/${cleaned}`);
    }
  };

  // ============================
  // Loading
  // ============================
  if (phase === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#10102a] to-[#141438] px-5">
        <AttributionCapture />
        <div className="w-full max-w-sm text-center">
          <div className="relative mx-auto h-28 w-28">
            <div className="absolute inset-0 rounded-full bg-violet-500/10" style={{ animation: "pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} />
            <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-white/5 border-t-violet-400" style={{ animationDuration: "1s" }} />
            <div className="absolute inset-3 animate-spin rounded-full border-[3px] border-white/5 border-t-indigo-400" style={{ animationDuration: "1.4s", animationDirection: "reverse" }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Avatar username={username} size={52} />
            </div>
          </div>

          <p className="mt-8 text-xl font-extrabold text-white">
            @{username}
          </p>
          <p className="mt-1 text-sm text-slate-400">を分析中...</p>

          <div className="mx-auto mt-6 space-y-3">
            {[
              { text: "公開投稿を取得中", delay: "0s" },
              { text: "リプライをスキャン中", delay: "0.8s" },
              { text: "法的リスクを解析中", delay: "1.6s" },
            ].map((step) => (
              <div key={step.text} className="animate-slide-up flex items-center justify-center gap-2.5 text-sm text-slate-500"
                style={{ animationDelay: step.delay, opacity: 0 }}>
                <div className="h-2 w-2 rounded-full bg-violet-400/60 animate-pulse" />
                {step.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============================
  // Error (fetch / API failure)
  // ============================
  if (phase === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-5 text-center">
        <div className="max-w-md">
          <p className="text-[11px] font-bold uppercase tracking-widest text-rose-500">
            Analysis failed
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight">
            診断結果を取得できませんでした
          </h1>
          <p className="mt-3 text-sm text-text-sub">
            アカウント <span className="font-mono font-bold">@{username}</span> の公開投稿を取得できませんでした。
          </p>
          {errorMsg && (
            <p className="mt-2 break-all rounded-lg bg-surface-2 px-3 py-2 font-mono text-[11px] text-text-muted">
              {errorMsg}
            </p>
          )}
          <p className="mt-4 text-xs leading-relaxed text-text-muted">
            アカウントが存在しないか、非公開（鍵アカ）になっている、または X API の制限に達している可能性があります。
            しばらく経ってから再度お試しください。
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-bold text-text-sub hover:border-violet-300 hover:text-violet-600"
          >
            トップに戻る
          </button>
        </div>
      </div>
    );
  }

  if (!result) return null;
  const lc = levelConfig[result.level];

  // ============================
  // Result
  // ============================
  return (
    <div className="min-h-screen bg-surface">
      {/* ===== Top bar ===== */}
      <div className="sticky top-0 z-40 border-b border-border bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-12 sm:h-14 max-w-2xl items-center justify-between px-3 sm:px-5">
          <button onClick={() => router.push("/")} className="flex items-center gap-1.5 text-sm text-text-sub hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            戻る
          </button>
          <div className="flex items-center gap-1.5">
            <Image src="/logo_icon.png" alt="ロゴ" width={22} height={22} />
            <span className="text-sm font-extrabold">開示請求<span className="text-gradient-blue">診断</span></span>
          </div>
          <button
            disabled={!result || result.source === "mock"}
            onClick={() => {
              if (!result || result.source === "mock") return;
              const siteUrl =
                typeof window !== "undefined" ? window.location.origin : "";
              const shareUrl = `${siteUrl}/diagnose/${result.username}`;
              const text = `@${result.username} の開示請求レベルは「${lc.label}」(${result.level} / スコア${result.score})\n\n公開投稿をAIで分析、開示請求の検討材料を無料で整理します 👇`;
              const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
              if (typeof navigator !== "undefined" && navigator.share) {
                navigator
                  .share({ title: "開示請求診断", text, url: shareUrl })
                  .catch(() => {
                    window.open(tweetUrl, "_blank", "noopener,noreferrer");
                  });
              } else {
                window.open(tweetUrl, "_blank", "noopener,noreferrer");
              }
            }}
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text-sub hover:border-violet-300 hover:text-violet-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Share2 className="h-3.5 w-3.5" />
            共有
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-5 py-6 sm:py-8">
        {/* ===== Mock data banner (本番では絶対に出ない) ===== */}
        {result.source === "mock" && (
          <div className="mb-5 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-4 text-center">
            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700">
              Demo Data
            </p>
            <p className="mt-1 text-xs leading-relaxed text-amber-900">
              これは開発用のサンプル表示です。実際の X アカウントは分析していません。
            </p>
          </div>
        )}

        {/* ===== Verdict Hero (Dark) ===== */}
        <div className="animate-bounce-in overflow-hidden rounded-3xl bg-gradient-to-br from-[#10102a] via-[#141438] to-[#1a1a45] p-5 sm:p-7 text-white">
          {/* Top: user + level badge inline */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar username={result.username} size={44} />
              <div>
                <p className="text-base font-extrabold leading-tight">@{result.username}</p>
                <p className="text-xs text-slate-500">{new Date().toLocaleDateString("ja-JP")}</p>
              </div>
            </div>
            <span className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${lc.gradient} text-2xl font-black shadow-lg shadow-black/20`}>
              {result.level}
            </span>
          </div>

          {/* Score + Level row */}
          <div className="mt-6 flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
            {/* Score ring */}
            <div className="shrink-0">
              <ScoreRing score={result.score} />
            </div>

            {/* Right side: level info */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">開示請求レベル</p>
              <p className={`mt-1 text-3xl sm:text-4xl font-black leading-tight tracking-tight ${lc.color}`}>{lc.label}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{lc.desc}</p>
            </div>
          </div>

          {/* Inline stats — full width below */}
          <div className="mt-6 grid grid-cols-3 gap-2">
            {[
              { value: result.totalPosts, label: "分析投稿", color: "text-blue-300" },
              { value: result.problemPosts, label: "問題投稿", color: "text-red-300" },
              { value: `${result.totalPosts > 0 ? ((result.problemPosts / result.totalPosts) * 100).toFixed(1) : "0.0"}%`, label: "問題率", color: "text-amber-300" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-white/[0.05] px-3 py-3 text-center">
                <p className={`text-xl font-black tracking-tight ${s.color}`}>{s.value}</p>
                <p className="mt-1 text-[10px] font-medium text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Data source caveat */}
          <p className="mt-4 text-center text-[10px] leading-relaxed text-slate-500">
            ※ X API v2 で取得した直近最大 100 件（RT 除く）が分析対象です。
            {result.source === "x-api+claude" && result.analyzedAt && (
              <> 取得時刻: {new Date(result.analyzedAt).toLocaleString("ja-JP")}</>
            )}
          </p>
        </div>

        {/* ===== 2. Problem posts — 感情を動かす ===== */}
        <div className="mt-5 rounded-2xl border border-border bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-extrabold tracking-tight">検出された問題投稿</h3>
            <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-600">
              上位3件
            </span>
          </div>

          {result.topPosts.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6 text-center">
              <p className="text-base font-extrabold text-emerald-700">問題投稿は検出されませんでした</p>
              <p className="mt-2 text-sm leading-relaxed text-emerald-600">
                分析対象の投稿に法的リスクのある表現は見つかりませんでした。
              </p>
            </div>
          ) : (
            <div className="relative mt-5">
              <div className="absolute left-[13px] top-3 bottom-3 w-px bg-border" />
              <div className="space-y-5">
                {result.topPosts.map((post, i) => {
                  const sc = severityConfig[post.severity];
                  return (
                    <div key={i} className="relative flex gap-4">
                      <div className="relative z-10 mt-1.5 shrink-0">
                        <div className={`h-[26px] w-[26px] rounded-full border-2 border-white ${sc.dot} shadow-sm`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${sc.color} ${sc.bg}`}>{sc.label}</span>
                          <span className="rounded-md bg-surface px-2 py-0.5 text-xs font-medium text-text-muted">{post.category}</span>
                          <span className="ml-auto flex items-center gap-1 text-xs text-text-muted">
                            <Clock className="h-3.5 w-3.5" />{post.date}
                          </span>
                        </div>
                        <p className="mt-2.5 rounded-xl bg-surface p-4 text-base leading-relaxed font-medium">{post.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {result.problemPosts > result.topPosts.length && (
            <p className="mt-5 text-center text-sm text-text-muted">
              他にも <span className="font-extrabold text-red-500 text-base">{Math.max(0, result.problemPosts - result.topPosts.length)}件</span> の問題投稿が検出されています
            </p>
          )}
        </div>

        {/* ===== 3. Category — 法的根拠を見せる ===== */}
        <div className="mt-5 rounded-2xl border border-border bg-white p-5 sm:p-6">
          <h3 className="text-base sm:text-lg font-extrabold tracking-tight">該当する可能性のある法令</h3>
          <p className="mt-1.5 text-xs text-text-muted">※ 当サービスによる独自分類であり、法的判断ではありません</p>
          <div className="mt-5 space-y-4">
            {result.categories.map((cat) => {
              const pct = result.problemPosts > 0 ? (cat.count / result.problemPosts) * 100 : 0;
              return (
                <div key={cat.name} className="flex items-center gap-3.5">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${cat.bg}`}>
                    <cat.icon className={`h-5 w-5 ${cat.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-bold">{cat.name}</span>
                      <span className={`font-black ${cat.color}`}>
                        <span className="text-xl tracking-tight">{cat.count}</span>
                        <span className="ml-0.5 text-xs">件</span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full animate-fill-bar"
                        style={{ width: `${pct}%`, backgroundColor: cat.color.includes("red") ? "#fca5a5" : cat.color.includes("amber") ? "#fcd34d" : cat.color.includes("violet") ? "#c4b5fd" : "#93c5fd" }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== 4. Urgency banner ===== */}
        <div className="mt-5 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-base font-extrabold text-amber-900 leading-snug">投稿が削除される前に証拠保全を</p>
              <p className="mt-2 text-sm leading-relaxed text-amber-700">
                相手が投稿を削除すると、開示請求に必要な証拠の収集が難しくなります。
                早めに詳細レポートを取得し、証拠保全の手続きを始めることをおすすめします。
              </p>
            </div>
          </div>
        </div>

        {/* ===== 2.5 Fact-based behavior data (moved here) ===== */}
        <div className="mt-5 rounded-2xl border border-border bg-white p-5 sm:p-6">
          <h3 className="text-base sm:text-lg font-extrabold tracking-tight">投稿行動データ</h3>

          {/* Basic facts */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-border bg-surface p-3 sm:p-4 text-center">
              <p className="text-[10px] font-medium text-text-muted">作成日</p>
              <p className="mt-1 text-sm sm:text-base font-extrabold tracking-tight">{result.profile.accountCreated}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3 sm:p-4 text-center">
              <p className="text-[10px] font-medium text-text-muted">リプライ率</p>
              <p className="mt-1 text-lg sm:text-xl font-black tracking-tight text-indigo-600">{result.replyRatio}<span className="text-xs">%</span></p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3 sm:p-4 text-center">
              <p className="text-[10px] font-medium text-text-muted">問題投稿率</p>
              <p className="mt-1 text-lg sm:text-xl font-black tracking-tight text-red-500">{((result.problemPosts / result.totalPosts) * 100).toFixed(1)}<span className="text-xs">%</span></p>
            </div>
          </div>

          {/* Monthly problem post chart */}
          <div className="mt-6">
            <p className="text-xs font-bold text-text-sub">問題投稿の月別件数</p>
            <div className="mt-3 flex items-end gap-3 h-24">
              {result.monthlyProblemPosts.map((point, i) => {
                const maxCount = Math.max(...result.monthlyProblemPosts.map(p => p.count));
                return (
                  <div key={point.month} className="flex flex-1 flex-col items-center gap-1.5">
                    <span className="text-sm font-extrabold text-text-sub">{point.count}</span>
                    <div className="w-full rounded-t-lg bg-gradient-to-t from-violet-400 to-indigo-300 animate-fill-bar"
                      style={{ height: `${maxCount > 0 ? (point.count / maxCount) * 64 : 6}px`, animationDelay: `${i * 0.2}s` }} />
                    <span className="text-xs text-text-muted">{point.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mention targets */}
          <div className="mt-6">
            <p className="text-xs font-bold text-text-sub">リプライ・メンション先（上位）</p>
            <div className="mt-3 space-y-2.5">
              {result.mentionedUsers.map((u) => {
                const maxMention = result.mentionedUsers[0].count;
                return (
                  <div key={u.handle} className="flex items-center gap-3">
                    <span className="w-20 sm:w-24 shrink-0 truncate text-sm font-bold text-text-sub">@{u.handle}</span>
                    <div className="flex-1 h-2.5 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full bg-indigo-300 animate-fill-bar"
                        style={{ width: `${(u.count / maxMention) * 100}%` }} />
                    </div>
                    <span className="w-12 text-right text-sm font-extrabold text-text-sub">{u.count}<span className="text-[10px] font-medium ml-0.5">回</span></span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hostile keywords with counts */}
          <div className="mt-6">
            <p className="text-xs font-bold text-text-sub">固定辞書に一致した語（出現回数）</p>
            <p className="mt-0.5 text-[10px] text-text-muted">
              ※ 単純な部分一致のため、文脈次第で誤検知の可能性があります
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {result.hostileKeywords.map((kw) => (
                <span key={kw.word} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-bold text-text-sub">
                  {kw.word}
                  <span className="text-base font-black text-violet-600">{kw.count}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ===== 5. LINE gate — 旧: 月額500円 paywall ===== */}
        <LineGateCard username={username} />

        {/* ===== 5.5 What happens to them — 行動の動機付け ===== */}
        <div className="mt-5 rounded-2xl border border-border bg-white p-5 sm:p-6">
          <h3 className="text-base sm:text-lg font-extrabold tracking-tight">開示請求すると相手はどうなるか</h3>
          <p className="mt-1.5 text-xs text-text-muted">※ 一般的な法的手続きの流れに基づく情報です</p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {(
              [
                { Icon: UserSearch, label: "身元特定の可能性", desc: "氏名・住所が\nプロバイダから開示される場合", tone: "red" },
                { Icon: Coins,      label: "慰謝料請求の検討", desc: "名誉毀損で\n30〜100万円（参考相場）", tone: "red" },
                { Icon: Building2,  label: "職場・学校への波及", desc: "勤務先や学校に\n事実が伝わる場合", tone: "red" },
                { Icon: Gavel,      label: "刑事手続の対象", desc: "侮辱罪は懲役刑あり\n（2022年厳罰化）", tone: "red" },
                { Icon: Scroll,     label: "裁判記録が残る場合", desc: "判決は公開情報\nネットに名前が残ることも", tone: "amber" },
                { Icon: PiggyBank,  label: "防御費用が発生する場合", desc: "相手側も弁護士を\n雇う必要が生じうる", tone: "amber" },
              ] as { Icon: LucideIcon; label: string; desc: string; tone: "red" | "amber" }[]
            ).map(({ Icon, label, desc, tone }) => {
              const isRed = tone === "red";
              return (
                <div
                  key={label}
                  className={`relative overflow-hidden rounded-2xl border p-4 text-center ${
                    isRed
                      ? "border-red-200 bg-gradient-to-br from-red-50 to-rose-50/40"
                      : "border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/40"
                  }`}
                >
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white/90 shadow-sm">
                    <Icon className={`h-5 w-5 ${isRed ? "text-red-600" : "text-amber-600"}`} />
                  </div>
                  <p className={`mt-3 text-base font-extrabold tracking-tight ${isRed ? "text-red-800" : "text-amber-900"}`}>
                    {label}
                  </p>
                  <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-text-muted">
                    {desc}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 p-4 text-center">
            <p className="text-sm font-extrabold text-indigo-900 leading-relaxed">
              詳細レポートで証拠を揃えれば、<br className="sm:hidden" />法的対処を本格的に検討できます
            </p>
          </div>
        </div>

        {/* ===== 5.7 Cost simulation — 費用対効果を可視化 ===== */}
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

          {/* Cost breakdown */}
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

          {/* Compensation */}
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

          {/* ROI note */}
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

        {/* ===== 7. Profile + Account analysis（補足情報） ===== */}
        <div className="mt-5">
          <AccountProfileCard profile={result.profile} />
        </div>
        <div className="mt-5">
          <AccountAnalysisCard analysis={result.analysis} />
        </div>

        {/* ===== 8. 開示請求テンプレ（追加CTA） ===== */}
        <a
          href="/templates/disclosure-request"
          target="_blank"
          rel="noopener"
          className="mt-5 group flex items-center justify-between rounded-2xl border border-border bg-white px-5 py-4 transition-all hover:border-violet-200 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50">
              <FileText className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <p className="text-base font-extrabold">発信者情報開示請求書テンプレート</p>
              <p className="mt-0.5 text-xs text-text-muted">参考フォーマット・PDF 保存可能</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-text-muted group-hover:text-violet-500" />
        </a>

        {/* ===== Search another ===== */}
        <div className="mt-5 rounded-2xl border border-border bg-white p-5 text-center">
          <p className="text-base font-extrabold">別のアカウントを診断</p>
          <form onSubmit={handleNewSearch} className="mx-auto mt-4 max-w-sm">
            <div className="flex items-center rounded-2xl border-2 border-border bg-surface p-1.5 transition-all focus-within:border-violet-300">
              <span className="pl-3 text-lg font-bold text-text-muted/50">@</span>
              <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)}
                placeholder="ユーザー名" className="flex-1 bg-transparent px-2 py-3 text-base outline-none placeholder:text-text-muted/50" />
              <button type="submit"
                className="rounded-xl bg-gradient-to-r from-violet-400 to-indigo-400 px-5 py-3 text-sm font-extrabold text-white hover:from-violet-500 hover:to-indigo-500 active:scale-[0.97]">
                診断
              </button>
            </div>
          </form>
        </div>

        <p className="mt-8 pb-6 text-center text-xs text-text-muted">
          本サービスは法的助言を提供するものではありません。
          <a href="/about" className="ml-1 underline decoration-text-muted/30 underline-offset-2 hover:text-text-sub">詳しく見る</a>
        </p>
      </div>
    </div>
  );
}
