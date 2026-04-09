"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  Shield,
  ShieldAlert,
  AlertTriangle,
  MessageCircle,
  AtSign,
  Mail,
  Hash,
  Clock,
  Scale,
  Loader2,
  Lock,
  ExternalLink,
  Crown,
  TrendingUp,
} from "lucide-react";
import type { MeData, AttackItem, AttackerSummary } from "@/lib/me-types";
import type { Severity } from "@/lib/diagnose-types";

// ============================================================
// Local helpers
// ============================================================
const SEVERITY_STYLE: Record<Severity, { label: string; bg: string; text: string; border: string; ring: string }> = {
  high:   { label: "高", bg: "bg-red-100",   text: "text-red-700",   border: "border-red-200",   ring: "ring-red-200" },
  medium: { label: "中", bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", ring: "ring-amber-200" },
  low:    { label: "低", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200", ring: "ring-slate-200" },
};

const CHANNEL_META = {
  mention: { label: "メンション", icon: AtSign, color: "text-blue-500" },
  reply:   { label: "リプライ",   icon: MessageCircle, color: "text-violet-500" },
  dm:      { label: "DM",         icon: Mail, color: "text-rose-500" },
} as const;

const LEVEL_GRADIENT: Record<AttackerSummary["estimatedLevel"], string> = {
  S: "from-red-500 to-rose-600",
  A: "from-orange-400 to-orange-500",
  B: "from-amber-400 to-amber-500",
  C: "from-yellow-400 to-yellow-500",
  D: "from-blue-400 to-blue-500",
  E: "from-emerald-400 to-emerald-500",
};

// ============================================================
// Page
// ============================================================
export function MeClient() {
  const [data, setData] = useState<MeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"attackers" | "attacks">("attackers");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me");
        const json = (await res.json()) as { ok: boolean; data?: MeData; error?: string };
        if (cancelled) return;
        if (json.ok && json.data) setData(json.data);
        else setError(json.error ?? "データを取得できませんでした");
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "通信エラー");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5 text-center">
        <div>
          <p className="text-base font-extrabold">読み込みに失敗しました</p>
          <p className="mt-2 text-sm text-text-muted">{error}</p>
          <a href="/" className="mt-4 inline-block rounded-xl border border-border px-4 py-2 text-sm font-bold">
            ホームに戻る
          </a>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-rose-50/30 via-white to-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-rose-500" />
          <p className="mt-3 text-sm font-bold text-text-sub">あなたへの攻撃を集計中…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* ===== Top bar ===== */}
      <div className="safe-pt sticky top-0 z-40 border-b border-border bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-12 sm:h-14 max-w-2xl items-center justify-between px-3 sm:px-5">
          <a href="/" className="flex items-center gap-1.5 text-sm text-text-sub hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            戻る
          </a>
          <div className="flex items-center gap-1.5">
            <Image src="/logo_icon.png" alt="ロゴ" width={22} height={22} />
            <span className="text-sm font-extrabold">
              開示請求<span className="text-gradient-blue">診断</span>
            </span>
          </div>
          <span className="inline-flex h-8 items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 text-[11px] font-bold text-rose-700">
            <Shield className="h-3 w-3" />
            被害者モード
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-5 py-6 sm:py-8">
        {/* ===== Connection banner ===== */}
        {!data.connected && (
          <div className="mb-5 rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-50 to-orange-50 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 shadow-lg shadow-rose-500/30">
                <Lock className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-rose-600">DEMO MODE</p>
                <p className="text-[15px] font-extrabold tracking-tight">Xアカウント未連携</p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-rose-900">
                  現在表示されているのは<strong>デモデータ</strong>です。
                  Xアカウントを連携すると、<strong>あなた宛のリプライ・メンション・DM</strong>を実際に取得して分析できます。
                </p>
                <button className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 px-5 py-2.5 text-[13px] font-extrabold text-white shadow-lg shadow-rose-500/30 active:scale-[0.97]">
                  <Shield className="h-4 w-4" />
                  Xアカウントを連携する
                </button>
                <p className="mt-2 text-[10px] text-rose-700">
                  ※ 連携時は dm.read（DM読み取り）への同意が必要です
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ===== Hero ===== */}
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a0f1f] via-[#2d1424] to-[#3d1825] p-5 sm:p-7 text-white">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-300" />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-rose-300">VICTIM REPORT</span>
          </div>
          <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight">
            あなたへの攻撃投稿
            <br />
            <span className="text-rose-300">{data.totals.attacks}件</span>
            <span className="text-base font-bold text-slate-400"> / 加害者 {data.totals.attackers}名</span>
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-400">
            自分宛のメンション・リプライ・DMをAIが解析し、法的に問題のある投稿を抽出しました。
          </p>

          {/* Severity stats */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              { label: "高", value: data.totals.high, color: "text-red-300" },
              { label: "中", value: data.totals.medium, color: "text-amber-300" },
              { label: "低", value: data.totals.low, color: "text-blue-300" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-white/[0.06] px-3 py-3 text-center">
                <p className={`text-2xl font-black tracking-tight ${s.color}`}>{s.value}</p>
                <p className="mt-1 text-[10px] font-medium text-slate-500">重要度{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ===== Tab switcher ===== */}
        <div className="mt-5 flex rounded-2xl border border-border bg-white p-1">
          {[
            { key: "attackers", label: `加害者 ${data.attackers.length}名`, icon: TrendingUp },
            { key: "attacks", label: `投稿 ${data.totals.attacks}件`, icon: AlertTriangle },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as "attackers" | "attacks")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-[12px] font-extrabold transition-all ${
                tab === t.key
                  ? "bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-md shadow-rose-500/30"
                  : "text-text-muted active:bg-surface"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ===== Attackers tab ===== */}
        {tab === "attackers" && (
          <section className="mt-5 space-y-3">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-rose-600">RANKING</p>
                <h2 className="mt-1 text-[18px] font-extrabold tracking-tight sm:text-xl">加害者ランキング</h2>
                <p className="mt-0.5 text-[10.5px] text-text-muted">攻撃の重大性 × 件数で並び替え</p>
              </div>
              <span className="rounded-full bg-rose-50 px-3 py-1 text-[11px] font-bold text-rose-600">
                訴訟優先順
              </span>
            </div>
            {data.attackers.map((atk, idx) => (
              <AttackerCard key={atk.username} rank={idx + 1} atk={atk} />
            ))}
          </section>
        )}

        {/* ===== Attacks tab ===== */}
        {tab === "attacks" && (
          <section className="mt-5 space-y-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-rose-600">EVIDENCE</p>
              <h2 className="mt-1 text-[18px] font-extrabold tracking-tight sm:text-xl">検出された攻撃 全{data.attacks.length}件</h2>
              <p className="mt-0.5 text-[10.5px] text-text-muted">
                各投稿に SHA-256 データ整合性ハッシュ & 取得時刻を付与
              </p>
            </div>
            {data.attacks.map((a, idx) => (
              <AttackCard key={a.id} idx={idx + 1} attack={a} />
            ))}
          </section>
        )}

        {/* ===== Lawyer referral CTA ===== */}
        <section className="mt-8 overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-violet-50 to-white p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-600">LAWYER REFERRAL</p>
              <p className="text-[15px] font-extrabold tracking-tight">提携弁護士事務所への取次</p>
            </div>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-text-sub">
            検出された全攻撃と加害者リストを、ハッシュ付きで提携弁護士事務所に共有できます。
            <strong>本サービスから法的助言は行いません</strong>。最終判断は弁護士にお任せください。
          </p>
          <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-3.5 text-[14px] font-extrabold text-white shadow-lg shadow-indigo-500/30 active:scale-[0.98]">
            <Scale className="h-4 w-4" />
            証拠データを弁護士に取次依頼
          </button>
        </section>

        {/* ===== Disclaimer ===== */}
        <div className="safe-pb mt-8 rounded-2xl border border-amber-200 bg-amber-50/60 px-4 py-3.5 text-[10.5px] leading-relaxed text-amber-900">
          <p className="font-bold">重要なお知らせ</p>
          <p className="mt-1">
            本サービスはAIによる投稿分類のみを提供しており、<strong>法的助言・法律相談は行いません</strong>。
            投稿の違法性や開示請求の可否についての最終判断は、必ず弁護士にご確認ください。
            参考条文の表示はAIによる分類結果であり、該当性を保証するものではありません。
            {data.source === "mock" && " ※現在の表示はデモデータです。"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Attacker card
// ============================================================
function AttackerCard({ rank, atk }: { rank: number; atk: AttackerSummary }) {
  const gradient = LEVEL_GRADIENT[atk.estimatedLevel];
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
// Attack card — single hostile post
// ============================================================
function AttackCard({ idx, attack }: { idx: number; attack: AttackItem }) {
  const sev = SEVERITY_STYLE[attack.severity === "none" ? "low" : attack.severity];
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
          <p className="mt-2 text-[11px]">
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
