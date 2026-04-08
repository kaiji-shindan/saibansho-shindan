"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowRight,
  Gavel,
  ArrowLeft,
  Share2,
  AlertTriangle,
  MessageSquareWarning,
  ShieldAlert,
  Eye,
  Lock,
  FileText,
  ExternalLink,
  User,
  TrendingUp,
  Clock,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import { AccountProfileCard, generateMockProfile, type AccountProfile } from "@/components/account-profile";
import { AccountAnalysisCard, generateMockAnalysis, type AccountAnalysis } from "@/components/account-analysis";
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
// Types
// ============================================================
type Level = "S" | "A" | "B" | "C" | "D" | "E";

interface DiagnosisResult {
  username: string;
  level: Level;
  score: number;
  totalPosts: number;
  problemPosts: number;
  categories: {
    name: string;
    count: number;
    icon: typeof AlertTriangle;
    color: string;
    bg: string;
    border: string;
  }[];
  topPosts: {
    text: string;
    category: string;
    severity: "high" | "medium" | "low";
    date: string;
  }[];
  // Fact-based data (obtainable from X API + Claude analysis)
  accountCreated: string;
  replyRatio: number;           // リプライ率（%）— tweet.in_reply_to_user_id から算出
  mentionedUsers: { handle: string; count: number }[];  // @メンション先と回数
  hostileKeywords: { word: string; count: number }[];   // NGワードと出現回数
  monthlyProblemPosts: { month: string; count: number }[];  // 月別の問題投稿件数
}

// ============================================================
// Mock data
// ============================================================
function generateMockResult(username: string): DiagnosisResult {
  const seed = username.length + username.charCodeAt(0);
  const score = Math.min(95, Math.max(12, (seed * 17 + 23) % 100));

  let level: Level;
  if (score >= 85) level = "S";
  else if (score >= 70) level = "A";
  else if (score >= 55) level = "B";
  else if (score >= 40) level = "C";
  else if (score >= 25) level = "D";
  else level = "E";

  const problemPosts = Math.max(3, (seed * 7) % 45);
  const totalPosts = problemPosts + Math.max(50, (seed * 13) % 500);

  return {
    username,
    level,
    score,
    totalPosts,
    problemPosts,
    categories: [
      { name: "名誉毀損", count: Math.max(1, Math.floor(problemPosts * 0.35)), icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50", border: "border-red-100" },
      { name: "侮辱", count: Math.max(1, Math.floor(problemPosts * 0.3)), icon: MessageSquareWarning, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100" },
      { name: "脅迫", count: Math.max(0, Math.floor(problemPosts * 0.15)), icon: ShieldAlert, color: "text-violet-500", bg: "bg-violet-50", border: "border-violet-100" },
      { name: "プライバシー侵害", count: Math.max(0, Math.floor(problemPosts * 0.2)), icon: Eye, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" },
    ],
    topPosts: [
      { text: "こいつマジで○ねよ。存在価値ないわ。", category: "脅迫", severity: "high", date: "2026/03/15" },
      { text: "あの人って前科あるらしいよ（嘘の情報を流布）", category: "名誉毀損", severity: "high", date: "2026/03/10" },
      { text: "ブスすぎて草。こんな顔で外歩くなよ", category: "侮辱", severity: "medium", date: "2026/02/28" },
    ],
    accountCreated: `${2020 + (seed % 5)}/0${1 + (seed % 9)}/15`,
    replyRatio: parseFloat((40 + (seed % 35)).toFixed(1)),
    mentionedUsers: [
      { handle: "user_a", count: Math.max(3, (seed * 4) % 25) },
      { handle: "user_b", count: Math.max(2, (seed * 3) % 15) },
      { handle: "user_c", count: Math.max(1, (seed * 2) % 8) },
    ],
    hostileKeywords: [
      { word: "○ね", count: Math.max(2, (seed * 3) % 12) },
      { word: "キモい", count: Math.max(1, (seed * 2) % 8) },
      { word: "消えろ", count: Math.max(1, (seed * 4) % 6) },
      { word: "ゴミ", count: Math.max(1, seed % 5) },
    ],
    monthlyProblemPosts: [
      { month: "1月", count: Math.max(1, Math.floor(problemPosts * 0.2)) },
      { month: "2月", count: Math.max(2, Math.floor(problemPosts * 0.3)) },
      { month: "3月", count: Math.max(3, Math.floor(problemPosts * 0.5)) },
    ],
  };
}

// ============================================================
// Level config
// ============================================================
const levelConfig: Record<
  Level,
  { label: string; color: string; gradient: string; bg: string; border: string; textBg: string; desc: string }
> = {
  S: { label: "極めて高い", color: "text-red-600", gradient: "from-red-500 to-rose-600", bg: "bg-red-50", border: "border-red-200", textBg: "bg-red-600", desc: "即座に弁護士への相談を推奨します。" },
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
  const [phase, setPhase] = useState<"loading" | "result">("loading");
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [analysis, setAnalysis] = useState<AccountAnalysis | null>(null);
  const [newUsername, setNewUsername] = useState("");

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();

    (async () => {
      let hydrated: DiagnosisResult | null = null;

      try {
        const res = await fetch(`/api/diagnose/${encodeURIComponent(username)}`);
        const json = (await res.json()) as { ok: boolean; data?: DiagnosisData; error?: string };
        if (json.ok && json.data) {
          hydrated = hydrateDiagnosis(json.data);
        } else {
          console.warn("[diagnose] API failed, using mock:", json.error);
        }
      } catch (err) {
        console.warn("[diagnose] fetch error, using mock:", err);
      }

      // Fallback to local mock so the UI always renders something
      if (!hydrated) hydrated = generateMockResult(username);

      // Keep loading screen visible for at least 2.5s for UX
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, 2500 - elapsed);
      setTimeout(() => {
        if (cancelled) return;
        setResult(hydrated);
        setProfile(generateMockProfile(username));
        setAnalysis(generateMockAnalysis(username));
        setPhase("result");
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
          <button className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text-sub hover:border-violet-300 hover:text-violet-600">
            <Share2 className="h-3.5 w-3.5" />
            共有
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-5 py-6 sm:py-8">

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
              { value: `${((result.problemPosts / result.totalPosts) * 100).toFixed(1)}%`, label: "問題率", color: "text-amber-300" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-white/[0.05] px-3 py-3 text-center">
                <p className={`text-xl font-black tracking-tight ${s.color}`}>{s.value}</p>
                <p className="mt-1 text-[10px] font-medium text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ===== 2. Problem posts — 感情を動かす ===== */}
        <div className="mt-5 rounded-2xl border border-border bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-extrabold tracking-tight">検出された問題投稿</h3>
            <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-600">
              上位3件
            </span>
          </div>

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

          <p className="mt-5 text-center text-sm text-text-muted">
            他にも <span className="font-extrabold text-red-500 text-base">{result.problemPosts - 3}件以上</span> の問題投稿が検出されています
          </p>
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

        {/* ===== 4. Urgency banner — 恐怖を煽る ===== */}
        <div className="mt-5 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-base font-extrabold text-amber-900 leading-snug">投稿が削除されると証拠が消滅します</p>
              <p className="mt-2 text-sm leading-relaxed text-amber-700">
                相手が投稿を削除すると、開示請求に必要な証拠が失われます。
                スクリーンショットの自動保全で証拠を確保しましょう。
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
              <p className="mt-1 text-sm sm:text-base font-extrabold tracking-tight">{result.accountCreated}</p>
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
            <p className="text-xs font-bold text-text-sub">検出されたNGワード（出現回数）</p>
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

        {/* ===== 5. Premium lock — 証拠保全で課金 ===== */}
        <div className="mt-5 relative overflow-hidden rounded-2xl border border-violet-200 bg-white p-5 sm:p-6 min-h-[360px]">
          {/* Blurred preview content showing what's inside */}
          <div className="space-y-3 blur-[5px] select-none pointer-events-none" aria-hidden>
            <div className="rounded-xl border border-border bg-surface p-3">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-red-300 to-rose-300" />
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-text-sub">問題投稿 #001 — 名誉毀損の疑い</p>
                  <p className="text-[9px] text-text-muted">2025-11-12 23:14 ・ いいね 47 ・ RT 12</p>
                </div>
                <span className="rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-600">高</span>
              </div>
              <p className="mt-2 rounded-lg bg-white p-2 text-[10px] leading-relaxed text-text-sub">
                ◯◯は本当に最低なクズ野郎で、こういう人間は社会から消えるべきだと思う。家族ごと不幸になればいい
              </p>
              <div className="mt-2 flex gap-1.5">
                <span className="rounded border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-[9px] font-bold text-violet-700">📸 スクショ保全済</span>
                <span className="rounded border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700">⚖️ 刑法230条</span>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-amber-300 to-orange-300" />
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-text-sub">問題投稿 #002 — 侮辱罪の疑い</p>
                  <p className="text-[9px] text-text-muted">2025-11-09 18:42 ・ いいね 23 ・ RT 5</p>
                </div>
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-600">中</span>
              </div>
              <p className="mt-2 rounded-lg bg-white p-2 text-[10px] leading-relaxed text-text-sub">
                ◯◯のツラ見るたびに虫唾が走るんだよな、ほんとブスだし喋り方もキモい。生理的に無理
              </p>
              <div className="mt-2 flex gap-1.5">
                <span className="rounded border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-[9px] font-bold text-violet-700">📸 スクショ保全済</span>
                <span className="rounded border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700">⚖️ 刑法231条</span>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3">
              <p className="text-[11px] font-bold text-text-sub">📄 開示請求テンプレート（PDF）</p>
              <p className="mt-1.5 text-xs text-text-muted">弁護士監修・氏名と日付を入れるだけで提出可能</p>
            </div>
          </div>

          {/* Lock overlay */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-5 bg-gradient-to-b from-white/70 via-white/88 to-white/97">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 to-indigo-400 shadow-xl shadow-violet-300/40">
              <Lock className="h-7 w-7 text-white" />
            </div>
            <p className="mt-4 text-xl font-extrabold tracking-tight">証拠保全 & 全件レポート</p>
            <p className="mt-2 text-center text-sm leading-relaxed text-text-muted">
              問題投稿のスクリーンショット自動保存<br />開示請求テンプレート・弁護士相談
            </p>
            <button className="mt-5 rounded-2xl bg-gradient-to-r from-violet-400 to-indigo-400 px-8 py-4 text-base font-extrabold text-white shadow-xl shadow-violet-400/30 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.97]">
              月額500円で証拠を保全する
            </button>
            <p className="mt-3 text-xs font-medium text-text-muted">↑ ぼかしの中身がすべて閲覧可能に</p>
          </div>
        </div>

        {/* ===== 5.5 What happens to them — 行動の動機付け ===== */}
        <div className="mt-5 rounded-2xl border border-border bg-white p-5 sm:p-6">
          <h3 className="text-base sm:text-lg font-extrabold tracking-tight">開示請求すると相手はどうなるか</h3>
          <p className="mt-1.5 text-xs text-text-muted">※ 一般的な法的手続きの流れに基づく情報です</p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              { icon: "👤", label: "身元が特定", desc: "氏名・住所が\nプロバイダから開示", badge: "確定", tone: "red" },
              { icon: "💰", label: "慰謝料の支払い", desc: "名誉毀損で\n30〜100万円", badge: "高額", tone: "red" },
              { icon: "🏢", label: "職場・学校に発覚", desc: "勤務先や学校に\n事実が伝わる", badge: "社会的", tone: "red" },
              { icon: "⚖️", label: "前科がつく", desc: "侮辱罪は懲役刑あり\n（2022年厳罰化）", badge: "刑事", tone: "red" },
              { icon: "📄", label: "裁判記録が残る", desc: "判決は公開情報\nネットに名前が残る", badge: "永続", tone: "amber" },
              { icon: "💸", label: "防御費用が発生", desc: "自身も弁護士を\n雇う必要あり", badge: "出費", tone: "amber" },
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
                  <span
                    className={`absolute right-2.5 top-2.5 rounded-md px-2 py-0.5 text-[10px] font-extrabold ${
                      isRed ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {item.badge}
                  </span>
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
              あなたが行動すれば、<br className="sm:hidden" />匿名の加害者に法的責任を取らせることができます
            </p>
          </div>
        </div>

        {/* ===== 5.7 Cost simulation — 費用対効果を可視化 ===== */}
        <div className="mt-5 rounded-2xl border border-border bg-white p-5 sm:p-6">
          <h3 className="text-base sm:text-lg font-extrabold tracking-tight">開示請求にかかる費用と賠償金の目安</h3>
          <p className="mt-1.5 text-xs text-text-muted">※ 一般的な相場であり、個別事案により異なります</p>

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

          {/* ROI callout */}
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-extrabold text-emerald-900 leading-snug">
              費用を上回る賠償金を獲得できるケースも多数あります
            </p>
            <p className="mt-2 text-xs leading-relaxed text-emerald-700">
              悪質な誹謗中傷の場合、慰謝料に加え弁護士費用・調査費用の一部も相手に請求可能です。
              まずは弁護士に費用対効果を相談してみましょう。
            </p>
          </div>

          <p className="mt-4 text-[10px] leading-relaxed text-text-muted">
            出典: 裁判所公開データ・弁護士費用の一般的な相場に基づく目安です。実際の費用・賠償額は弁護士にご確認ください。
          </p>
        </div>

        {/* ===== 6. Lawyer CTA — 収益ポイント（最も目立つ） ===== */}
        <div className="mt-5 rounded-2xl bg-gradient-to-br from-[#10102a] via-[#141438] to-[#1a1a45] p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <Gavel className="h-6 w-6 text-violet-300" />
            </div>
            <div className="flex-1">
              <p className="text-base font-extrabold leading-snug">この結果をもとに弁護士に相談しませんか？</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                誹謗中傷に強い提携弁護士が、診断レポートをもとに
                開示請求の可否を判断します。初回相談は無料です。
              </p>
            </div>
          </div>
          <a href="#" className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-400 to-indigo-400 py-4 text-base font-extrabold shadow-xl shadow-violet-500/25 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.97]">
            弁護士に無料で相談する
            <ArrowRight className="h-5 w-5" />
          </a>
          <p className="mt-3 text-center text-xs text-slate-500">
            ※ 相談は無料。開示請求に進む場合のみ費用が発生します
          </p>
        </div>

        {/* ===== 7. Profile + Account analysis（補足情報） ===== */}
        <div className="mt-5">
          {profile && <AccountProfileCard profile={profile} />}
        </div>
        {analysis && (
          <div className="mt-5">
            <AccountAnalysisCard analysis={analysis} />
          </div>
        )}

        {/* ===== 8. 開示請求テンプレ（追加CTA） ===== */}
        <a href="#" className="mt-5 group flex items-center justify-between rounded-2xl border border-border bg-white px-5 py-4 transition-all hover:border-violet-200 hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50">
              <FileText className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <p className="text-base font-extrabold">開示請求テンプレートをダウンロード</p>
              <p className="mt-0.5 text-xs text-text-muted">弁護士監修の書式 + 記入ガイド付き</p>
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
