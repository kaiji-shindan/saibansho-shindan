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
  Camera,
  Download,
  FileText,
  MessageCircle,
  Scale,
  Sparkles,
  Calendar,
  CreditCard,
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
  AtSign,
  Mail,
  Crown,
  Link2,
  Shield,
} from "lucide-react";
import { generateConnectedAnalysis, type AttackItem, type AttackerSummary, type ConnectedAnalysis } from "@/lib/x-connected-mock";
import type { DiagnosisData, ClassifiedTweet, Severity, Level, CategoryName } from "@/lib/diagnose-types";
import { AccountProfileCard, generateMockProfile, type AccountProfile } from "@/components/account-profile";
import { AccountAnalysisCard, generateMockAnalysis, type AccountAnalysis } from "@/components/account-analysis";

// ============================================================
// Local UI building blocks (mirrors the diagnose result page)
// ============================================================
const levelConfig: Record<
  Level,
  { label: string; color: string; gradient: string; desc: string }
> = {
  S: { label: "極めて高い", color: "text-red-600",     gradient: "from-red-500 to-rose-600",    desc: "即座に弁護士への相談を推奨します。" },
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
  { title: "発信者情報開示請求書（参考フォーマット）", desc: "提携弁護士事務所による監修予定", size: "PDF" },
  { title: "損害賠償請求書（参考フォーマット）", desc: "氏名・日付の記入欄付き", size: "PDF" },
  { title: "証拠保全申立書（参考フォーマット）", desc: "裁判所提出用の記入例付き", size: "PDF" },
  { title: "刑事告訴状（参考フォーマット）", desc: "警察署提出用の記入例付き", size: "PDF" },
];

// ============================================================
// Main component
// ============================================================
const CONNECTED_KEY = "x_account_connected_v1";
const CHANNEL_META = {
  mention: { label: "メンション", icon: AtSign, color: "text-blue-500" },
  reply:   { label: "リプライ",   icon: MessageCircle, color: "text-violet-500" },
  dm:      { label: "DM",         icon: Mail, color: "text-rose-500" },
} as const;
const ATTACKER_LEVEL_GRADIENT: Record<AttackerSummary["estimatedLevel"], string> = {
  S: "from-red-500 to-rose-600",
  A: "from-orange-400 to-orange-500",
  B: "from-amber-400 to-amber-500",
  C: "from-yellow-400 to-yellow-500",
  D: "from-blue-400 to-blue-500",
  E: "from-emerald-400 to-emerald-500",
};

export function PremiumClient({ username }: { username: string }) {
  const [data, setData] = useState<DiagnosisData | null>(null);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [analysis, setAnalysis] = useState<AccountAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [xConnected, setXConnected] = useState(false);
  const [connectedData, setConnectedData] = useState<ConnectedAnalysis | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(CONNECTED_KEY);
    if (stored === "true") {
      setXConnected(true);
      setConnectedData(generateConnectedAnalysis());
    }
  }, []);

  const handleConnect = () => {
    setXConnected(true);
    setConnectedData(generateConnectedAnalysis());
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CONNECTED_KEY, "true");
    }
  };

  const handleDisconnect = () => {
    setXConnected(false);
    setConnectedData(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(CONNECTED_KEY);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/diagnose/${encodeURIComponent(username)}`);
        const json = (await res.json()) as { ok: boolean; data?: DiagnosisData; error?: string };
        if (cancelled) return;
        if (json.ok && json.data) {
          setData(json.data);
          setProfile(generateMockProfile(username));
          setAnalysis(generateMockAnalysis(username));
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

  if (!data) {
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
  const nextBilling = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toLocaleDateString("ja-JP");
  })();

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

          {/* PRO ribbon */}
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-violet-300/30 bg-violet-500/15 px-3 py-1 text-[11px] font-bold text-violet-200">
            <BadgeCheck className="h-3 w-3" />
            プレミアム会員 — 全件レポート閲覧可
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
        </div>

        {/* ===== 1.4 X account connection ===== */}
        <div className={`mt-5 overflow-hidden rounded-3xl border p-5 sm:p-6 ${xConnected ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50" : "border-rose-200 bg-gradient-to-br from-rose-50 to-orange-50"}`}>
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-lg ${xConnected ? "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-500/30" : "bg-gradient-to-br from-rose-500 to-orange-500 shadow-rose-500/30"}`}>
              <Link2 className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[11px] font-bold uppercase tracking-wide ${xConnected ? "text-emerald-600" : "text-rose-600"}`}>
                X ACCOUNT CONNECTION
              </p>
              <p className="text-[15px] font-extrabold tracking-tight">
                {xConnected ? "Xアカウント連携済み" : "Xアカウントを連携するとさらに分析できます"}
              </p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-text-sub">
                {xConnected
                  ? "あなた宛のリプライ・メンション・DMをAIが解析し、加害者ランキングと攻撃投稿の全件をページ下部に表示しています。"
                  : "あなた自身が誹謗中傷を受けている場合、Xアカウントを連携することで「あなた宛のリプライ・メンション・DM」を解析し、加害者ランキングを生成できます。"}
              </p>
              {!xConnected && (
                <button
                  onClick={handleConnect}
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 px-5 py-2.5 text-[13px] font-extrabold text-white shadow-lg shadow-rose-500/30 active:scale-[0.97]"
                >
                  <Link2 className="h-4 w-4" />
                  Xアカウントを連携する
                </button>
              )}
              {xConnected && (
                <button
                  onClick={handleDisconnect}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-white px-3 py-1 text-[11px] font-bold text-emerald-700 active:bg-emerald-50"
                >
                  連携を解除
                </button>
              )}
              {!xConnected && (
                <p className="mt-2 text-[10px] text-rose-700">
                  ※ 連携時は dm.read（DM読み取り）への同意が必要です
                </p>
              )}
            </div>
          </div>
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
              問題投稿の支配的な感情を5軸で集計（AIによる文章解析結果。心理学的診断ではありません）
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
                <h3 className="mt-0.5 text-base sm:text-lg font-extrabold tracking-tight">直近7日間の投稿時間帯</h3>
              </div>
              <Activity className="h-5 w-5 text-violet-500" />
            </div>
            <p className="mt-1 text-[11px] text-text-muted">
              分析対象: 過去7日間の投稿（X API Basic制約）。色が濃いほど投稿が多い曜日・時間帯
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
              <p className="mt-1 text-sm sm:text-base font-extrabold tracking-tight">{data.accountCreated}</p>
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
              <p className="text-xs font-bold text-text-sub">検出されたNGワード（出現回数）</p>
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

        {/* ===== 4.6 Cost simulation ===== */}
        <div className="mt-5 rounded-2xl border border-border bg-white p-5 sm:p-6">
          <h3 className="text-base sm:text-lg font-extrabold tracking-tight">開示請求にかかる費用と賠償金の目安</h3>
          <p className="mt-1.5 text-xs text-text-muted">※ 一般的な相場であり、個別事案により異なります</p>

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

        {/* ===== 5. PREMIUM — PDF templates ===== */}
        <div className="mt-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-600">DOCUMENTS</p>
          <h3 className="mt-1 text-base sm:text-lg font-extrabold tracking-tight">弁護士監修テンプレート</h3>
          <p className="mt-1 text-[12px] text-text-muted">提携弁護士事務所による監修予定の参考フォーマット集</p>

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

        {/* ===== 6. PREMIUM — Lawyer referral ===== */}
        <div className="mt-8 overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-violet-50 to-white p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-600">LAWYER REFERRAL</p>
              <p className="text-[15px] font-extrabold tracking-tight">提携弁護士事務所への取次</p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-white px-4 py-3.5 shadow-sm">
            <p className="text-[12px] leading-relaxed text-text-sub">
              本診断結果（投稿データ・分類根拠・スコア）を提携弁護士事務所に共有し、
              対応の可否や費用感について<strong className="font-bold text-foreground">弁護士から直接ご回答</strong>を受けられます。
              本サービスから法的助言を行うことはありません。
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-xl bg-indigo-50 px-3 py-2 text-center">
                <p className="font-bold text-indigo-600">取次費用</p>
                <p className="mt-0.5 text-[14px] font-extrabold text-indigo-900">無料</p>
              </div>
              <div className="rounded-xl bg-violet-50 px-3 py-2 text-center">
                <p className="font-bold text-violet-600">初回相談</p>
                <p className="mt-0.5 text-[14px] font-extrabold text-violet-900">弁護士事務所により異なる</p>
              </div>
            </div>
          </div>
          <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-3.5 text-[14px] font-extrabold text-white shadow-lg shadow-indigo-500/30 active:scale-[0.98]">
            <MessageCircle className="h-4 w-4" />
            提携弁護士事務所に取次を依頼する
          </button>
          <p className="mt-2 text-center text-[10px] text-text-muted">
            ※ 取次後の対応・契約・費用は弁護士事務所と直接お取り決めください
          </p>
        </div>

        {/* ===== 6.5 X-CONNECTED — Attackers & incoming attacks ===== */}
        {xConnected && connectedData && (
          <>
            <div className="mt-8 overflow-hidden rounded-3xl border border-rose-200 bg-gradient-to-br from-[#1a0f1f] via-[#2d1424] to-[#3d1825] p-5 sm:p-6 text-white">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-rose-300" />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-rose-300">YOUR INBOX</span>
              </div>
              <h2 className="mt-3 text-xl sm:text-2xl font-extrabold leading-tight tracking-tight">
                あなたへの攻撃投稿
                <br />
                <span className="text-rose-300">{connectedData.totals.attacks}件</span>
                <span className="text-sm font-bold text-slate-400"> / 加害者 {connectedData.totals.attackers}名</span>
              </h2>
              <p className="mt-2 text-[12px] leading-relaxed text-slate-400">
                Xアカウント連携により取得した、あなた宛のリプライ・メンション・DMのAI解析結果です
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { label: "高", value: connectedData.totals.high, color: "text-red-300" },
                  { label: "中", value: connectedData.totals.medium, color: "text-amber-300" },
                  { label: "低", value: connectedData.totals.low, color: "text-blue-300" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-white/[0.06] px-3 py-3 text-center">
                    <p className={`text-xl font-black tracking-tight ${s.color}`}>{s.value}</p>
                    <p className="mt-1 text-[10px] font-medium text-slate-500">重要度{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <section className="mt-5">
              <div className="mb-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-rose-600">RANKING</p>
                <h3 className="mt-1 text-base sm:text-lg font-extrabold tracking-tight">加害者ランキング</h3>
                <p className="mt-0.5 text-[10.5px] text-text-muted">攻撃の重大性 × 件数で訴訟優先順に並び替え</p>
              </div>
              <div className="space-y-3">
                {connectedData.attackers.map((atk, i) => (
                  <AttackerCard key={atk.username} rank={i + 1} atk={atk} />
                ))}
              </div>
            </section>

            <section className="mt-5">
              <div className="mb-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-rose-600">EVIDENCE</p>
                <h3 className="mt-1 text-base sm:text-lg font-extrabold tracking-tight">受信した攻撃 全{connectedData.attacks.length}件</h3>
                <p className="mt-0.5 text-[10.5px] text-text-muted">
                  メンション・リプライ・DMから検出。各投稿に SHA-256 ハッシュ & 取得時刻を付与
                </p>
              </div>
              <div className="space-y-3">
                {connectedData.attacks.map((a, i) => (
                  <AttackCard key={a.id} idx={i + 1} attack={a} />
                ))}
              </div>
            </section>
          </>
        )}

        {/* ===== 7. PREMIUM — Plan management ===== */}
        <div className="mt-8 rounded-2xl border border-border bg-white p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            <h3 className="text-base font-extrabold tracking-tight">プラン管理</h3>
          </div>
          <div className="mt-4 space-y-2.5">
            {[
              { icon: ShieldCheck, label: "プラン", value: "プレミアム（月額）", color: "text-violet-500" },
              { icon: CreditCard, label: "支払い方法", value: "Visa **** 4242", color: "text-indigo-500" },
              { icon: Calendar, label: "次回更新日", value: nextBilling, color: "text-blue-500" },
              { icon: CheckCircle2, label: "ご利用開始日", value: new Date().toLocaleDateString("ja-JP"), color: "text-emerald-500" },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3">
                <row.icon className={`h-4 w-4 ${row.color}`} />
                <span className="text-[12px] font-bold text-text-sub">{row.label}</span>
                <span className="ml-auto text-[13px] font-extrabold">{row.value}</span>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full rounded-2xl border border-border bg-white py-3 text-[12px] font-bold text-text-muted active:bg-surface">
            プランを解約する
          </button>
        </div>

        {/* ===== 8. Account profile + analysis (de-emphasized, bottom) ===== */}
        {profile && (
          <div className="mt-8">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">アカウント情報</p>
            <AccountProfileCard profile={profile} />
          </div>
        )}
        {analysis && (
          <div className="mt-5">
            <AccountAnalysisCard analysis={analysis} />
          </div>
        )}

        {/* ===== Disclaimer ===== */}
        <div className="safe-pb mt-8 rounded-2xl border border-amber-200 bg-amber-50/60 px-4 py-3.5 text-[10.5px] leading-relaxed text-amber-900">
          <p className="font-bold">重要なお知らせ</p>
          <p className="mt-1">
            本サービスはAIによる投稿分類・統計分析のみを提供しており、<strong>法的助言・法律相談・代理行為は一切行いません</strong>。
            投稿の違法性や開示請求の可否についての最終判断は、必ず提携弁護士事務所または各自で選任した弁護士にご確認ください。
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

      <div className="grid grid-cols-3 gap-px border-t border-border/70 bg-border/50">
        <button className="flex items-center justify-center gap-1.5 bg-white py-3 text-[11px] font-bold text-text-sub active:bg-surface">
          <Camera className="h-3.5 w-3.5 text-violet-500" />
          画像保存
        </button>
        <button className="flex items-center justify-center gap-1.5 bg-white py-3 text-[11px] font-bold text-text-sub active:bg-surface">
          <FileText className="h-3.5 w-3.5 text-indigo-500" />
          PDF出力
        </button>
        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 bg-white py-3 text-[11px] font-bold text-text-sub active:bg-surface"
        >
          <ExternalLink className="h-3.5 w-3.5 text-blue-500" />
          原文
        </a>
      </div>
    </article>
  );
}

// ============================================================
// Attacker card (for X-connected mode)
// ============================================================
function AttackerCard({ rank, atk }: { rank: number; atk: AttackerSummary }) {
  const gradient = ATTACKER_LEVEL_GRADIENT[atk.estimatedLevel];
  const dateRange = `${new Date(atk.firstSeen).toLocaleDateString("ja-JP")} 〜 ${new Date(atk.lastSeen).toLocaleDateString("ja-JP")}`;
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)]">
      <div className="flex items-center gap-3 p-4">
        <div className="relative">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-xl font-black text-white shadow-lg`}>
            {atk.estimatedLevel}
          </div>
          {rank <= 3 && (
            <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-white shadow-md">
              <Crown className="h-2.5 w-2.5" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-extrabold tracking-tight">@{atk.username}</p>
          <p className="text-[11px] text-text-muted">{dateRange}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {(["mention", "reply", "dm"] as const).map((c) => {
              const cnt = atk.channels[c];
              if (cnt === 0) return null;
              const meta = CHANNEL_META[c];
              const Icon = meta.icon;
              return (
                <span key={c} className="inline-flex items-center gap-1 rounded-md bg-surface px-1.5 py-0.5 text-[10px] font-bold text-text-sub">
                  <Icon className={`h-2.5 w-2.5 ${meta.color}`} />
                  {meta.label} {cnt}
                </span>
              );
            })}
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black tracking-tight text-rose-500">{atk.attackCount}</p>
          <p className="text-[9px] font-bold uppercase text-text-muted">attacks</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-px border-t border-border/70 bg-border/50">
        <a
          href={`/diagnose/${encodeURIComponent(atk.username)}`}
          className="flex items-center justify-center gap-1.5 bg-white py-3 text-[11px] font-bold text-text-sub active:bg-surface"
        >
          <ExternalLink className="h-3.5 w-3.5 text-violet-500" />
          このアカウントを診断
        </a>
        <a
          href={`https://x.com/${encodeURIComponent(atk.username)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 bg-white py-3 text-[11px] font-bold text-text-sub active:bg-surface"
        >
          <ExternalLink className="h-3.5 w-3.5 text-blue-500" />
          Xで開く
        </a>
      </div>
    </article>
  );
}

// ============================================================
// Attack card — single hostile incoming message (X-connected mode)
// ============================================================
function AttackCard({ idx, attack }: { idx: number; attack: AttackItem }) {
  const sevMap = {
    high:   { label: "高", bg: "bg-red-100",   text: "text-red-700",   border: "border-red-200" },
    medium: { label: "中", bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
    low:    { label: "低", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
  } as const;
  const sev = sevMap[attack.severity === "none" ? "low" : attack.severity];
  const id = String(idx).padStart(3, "0");
  const channel = CHANNEL_META[attack.channel];
  const ChannelIcon = channel.icon;
  const dateStr = new Date(attack.created_at).toLocaleString("ja-JP", {
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)]">
      <div className="flex items-center gap-2 border-b border-border/70 bg-surface/50 px-4 py-2.5">
        <span className="text-[11px] font-extrabold text-text-muted">#{id}</span>
        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-extrabold ${sev.bg} ${sev.text} ${sev.border}`}>
          {sev.label}
        </span>
        <span className="text-[11px] font-bold text-text-sub">{attack.category}</span>
        <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
          <ChannelIcon className="h-2.5 w-2.5" />
          {channel.label}
        </span>
      </div>
      <div className="px-4 py-3.5">
        <p className="flex items-center justify-between text-[10px] font-medium text-text-muted">
          <span>
            <Clock className="mr-1 inline h-3 w-3" />
            {dateStr}
          </span>
          <a
            href={`/diagnose/${encodeURIComponent(attack.attacker)}`}
            className="font-bold text-violet-600 hover:underline"
          >
            @{attack.attacker} →
          </a>
        </p>
        <p className="mt-2 rounded-xl bg-surface px-3.5 py-3 text-[13px] leading-relaxed text-foreground">
          {attack.text}
        </p>
        {attack.applicable_law && (
          <p className="mt-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-2 py-0.5 text-[10px] font-extrabold text-violet-700">
              <Scale className="h-2.5 w-2.5" />
              参考: {attack.applicable_law}
            </span>
          </p>
        )}
        {attack.reasoning && (
          <p className="mt-2 text-[11px] leading-relaxed text-text-muted">
            <span className="font-bold text-text-sub">AI判定根拠:</span> {attack.reasoning}
          </p>
        )}
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/50 px-2.5 py-1.5">
          <p className="flex items-center gap-1 text-[9px] font-bold text-emerald-700">
            <Hash className="h-2.5 w-2.5" />
            データ整合性ハッシュ (SHA-256)
          </p>
          <p className="mt-0.5 break-all font-mono text-[9px] text-emerald-800">{attack.hash}</p>
          <p className="mt-0.5 text-[9px] text-emerald-700">
            取得時刻: {new Date(attack.capturedAt).toLocaleString("ja-JP")}
          </p>
        </div>
      </div>
    </article>
  );
}
