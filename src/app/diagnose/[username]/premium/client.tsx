"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  BadgeCheck,
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
} from "lucide-react";
import type { DiagnosisData, ClassifiedTweet, Severity } from "@/lib/diagnose-types";
import { AccountProfileCard, generateMockProfile, type AccountProfile } from "@/components/account-profile";

// ============================================================
// Templates — wording reflects post-launch lawyer-supervised state.
// All documents will be reviewed and signed off by the affiliated
// law firm before public release.
// ============================================================
const TEMPLATES = [
  { title: "発信者情報開示請求書（参考フォーマット）", desc: "提携弁護士事務所による監修予定", size: "PDF" },
  { title: "損害賠償請求書（参考フォーマット）", desc: "氏名・日付の記入欄付き", size: "PDF" },
  { title: "証拠保全申立書（参考フォーマット）", desc: "裁判所提出用の記入例付き", size: "PDF" },
  { title: "刑事告訴状（参考フォーマット）", desc: "警察署提出用の記入例付き", size: "PDF" },
];

const SEVERITY_STYLE: Record<Severity, { label: string; bg: string; text: string; border: string }> = {
  high:   { label: "高", bg: "bg-red-100",   text: "text-red-700",   border: "border-red-200" },
  medium: { label: "中", bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
  low:    { label: "低", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
};

// ============================================================
// Page
// ============================================================
export function PremiumClient({ username }: { username: string }) {
  const [data, setData] = useState<DiagnosisData | null>(null);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const evidence = data.evidence ?? [];
  const nextBilling = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toLocaleDateString("ja-JP");
  })();

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-violet-50/40 via-white to-white">
      {/* ===== Header ===== */}
      <header className="safe-pt sticky top-0 z-20 border-b border-violet-100 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3 sm:px-6">
          <a href={`/diagnose/${username}`} className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-text-sub active:scale-[0.96]">
            <ArrowLeft className="h-4 w-4" />
          </a>
          <div className="flex items-center gap-2">
            <Image src="/logo_icon.png" alt="ロゴ" width={24} height={24} />
            <span className="text-[14px] font-extrabold tracking-tight">
              開示請求<span className="text-gradient-blue">診断</span>
            </span>
          </div>
          <span className="inline-flex h-9 items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-3 text-[11px] font-bold text-violet-700">
            <Sparkles className="h-3 w-3" />
            PRO
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 pt-5 pb-16 sm:px-6">
        {/* ===== 0. Account profile (first view) ===== */}
        {profile && (
          <section className="mb-5">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-600">分析対象アカウント</p>
            <AccountProfileCard profile={profile} />
          </section>
        )}

        {/* ===== 1. Activation banner ===== */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-500 p-5 text-white shadow-[0_20px_50px_-12px_rgba(124,58,237,0.45)] sm:p-6">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5" />
              <span className="text-[12px] font-bold uppercase tracking-widest text-white/90">プレミアムプラン有効</span>
            </div>
            <h1 className="mt-3 text-[24px] font-extrabold leading-tight tracking-tight sm:text-[28px]">
              証拠保全 & 全件レポートが
              <br />
              すべて閲覧可能になりました
            </h1>
            <p className="mt-2.5 text-[13px] leading-relaxed text-white/85 sm:text-sm">
              @{data.username} の分析結果はロックが解除されました。証拠の保全・PDF出力・弁護士相談がご利用いただけます。
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold backdrop-blur-sm">
                <Calendar className="h-3 w-3" /> 次回更新 {nextBilling}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold backdrop-blur-sm">
                <CreditCard className="h-3 w-3" /> ¥500 / 月
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold backdrop-blur-sm">
                {data.source === "x-api+claude" ? "● 実データ分析" : "● デモデータ"}
              </span>
            </div>
          </div>
        </div>

        {/* ===== 2. Result summary ===== */}
        <section className="mt-5 rounded-3xl border border-border bg-white p-5 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.06)] sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-500 text-xl font-black text-white shadow-lg shadow-red-500/30">
              {data.level}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-[12px] font-semibold text-text-muted">@{data.username}</p>
              <p className="text-[16px] font-extrabold tracking-tight">開示請求リスク {data.level}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase text-text-muted">スコア</p>
              <p className="text-2xl font-black text-red-500">{data.score}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wide text-red-600">問題投稿</p>
              <p className="mt-0.5 text-2xl font-black text-red-600">
                {data.problemPosts}
                <span className="ml-0.5 text-xs font-bold">件</span>
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">分析対象</p>
              <p className="mt-0.5 text-2xl font-black text-text-sub">
                {data.totalPosts}
                <span className="ml-0.5 text-xs font-bold">件</span>
              </p>
            </div>
          </div>
        </section>

        {/* ===== 3. Evidence list (real data) ===== */}
        <section className="mt-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-600">UNLOCKED</p>
              <h2 className="mt-1 text-[18px] font-extrabold tracking-tight sm:text-xl">
                検出された投稿 全{evidence.length}件
              </h2>
              <p className="mt-0.5 text-[10.5px] text-text-muted">
                AIによる分類結果。法的判断は弁護士の確認が必要です
              </p>
            </div>
            <button className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-white px-3 text-[12px] font-bold text-text-sub active:scale-[0.97]">
              <Download className="h-3.5 w-3.5" />
              一括DL
            </button>
          </div>

          {evidence.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-border bg-white px-4 py-8 text-center text-sm text-text-muted">
              問題のある投稿は検出されませんでした
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {evidence.map((ev, idx) => (
                <EvidenceCard key={ev.tweet_id} idx={idx + 1} ev={ev} username={data.username} />
              ))}
            </div>
          )}
        </section>

        {/* ===== 4. PDF templates ===== */}
        <section className="mt-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-600">DOCUMENTS</p>
          <h2 className="mt-1 text-[18px] font-extrabold tracking-tight sm:text-xl">弁護士監修テンプレート</h2>
          <p className="mt-1 text-[12px] text-text-muted">氏名と日付を入力するだけで、そのまま提出可能な書類です</p>

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
        </section>

        {/* ===== 5. Lawyer referral ===== */}
        <section className="mt-8 overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-violet-50 to-white p-5 sm:p-6">
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
        </section>

        {/* ===== 6. Plan management ===== */}
        <section className="mt-8 rounded-3xl border border-border bg-white p-5 sm:p-6">
          <h2 className="text-[16px] font-extrabold tracking-tight">プラン管理</h2>
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
        </section>

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
      </main>
    </div>
  );
}

// ============================================================
// Evidence card — one classified problem tweet
// ============================================================
function EvidenceCard({ idx, ev, username }: { idx: number; ev: ClassifiedTweet; username: string }) {
  const sev = SEVERITY_STYLE[ev.severity === "none" ? "low" : ev.severity];
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
          <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-violet-50 px-2 py-0.5 text-[10px] font-extrabold text-violet-700" title="参考条文（最終的な該当性は弁護士の判断が必要）">
            <Scale className="h-2.5 w-2.5" />
            参考: {ev.applicable_law}
          </span>
        )}
      </div>

      <div className="px-4 py-3.5">
        <p className="text-[10px] font-medium text-text-muted">{dateStr}</p>
        <p className="mt-2 rounded-xl bg-surface px-3.5 py-3 text-[13px] leading-relaxed text-foreground">
          {ev.text}
        </p>
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
                <span key={tag} className="rounded border border-border bg-white px-1.5 py-0.5 text-[10px] font-bold text-text-sub">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
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
