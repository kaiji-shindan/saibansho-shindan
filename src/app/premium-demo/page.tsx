"use client";

import Image from "next/image";
import {
  ArrowLeft,
  BadgeCheck,
  Camera,
  Download,
  FileText,
  Gavel,
  Lock,
  MessageCircle,
  Scale,
  Shield,
  ShieldCheck,
  Sparkles,
  Calendar,
  CreditCard,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

// ============================================================
// Dummy data
// ============================================================
const DEMO_USER = {
  handle: "demo_user_2026",
  displayName: "デモアカウント",
  level: "S" as const,
  score: 87,
  problemPosts: 14,
  totalPosts: 312,
  joinedAt: "2026-04-08",
  nextBilling: "2026-05-08",
};

const EVIDENCE = [
  {
    id: "001",
    severity: "high" as const,
    category: "名誉毀損",
    law: "刑法 230条",
    date: "2026-03-28 23:14",
    likes: 47,
    rt: 12,
    text: "◯◯は本当に最低なクズ野郎で、こういう人間は社会から消えるべきだと思う。家族ごと不幸になればいい。前科もあるって聞いたし。",
    tags: ["事実摘示", "公然性あり"],
  },
  {
    id: "002",
    severity: "high" as const,
    category: "脅迫",
    law: "刑法 222条",
    date: "2026-03-25 02:41",
    likes: 8,
    rt: 1,
    text: "次会ったら絶対に殴る。覚悟しとけよ。住所も知ってるからな。",
    tags: ["害悪の告知", "特定人物宛"],
  },
  {
    id: "003",
    severity: "medium" as const,
    category: "侮辱",
    law: "刑法 231条",
    date: "2026-03-19 18:42",
    likes: 23,
    rt: 5,
    text: "◯◯のツラ見るたびに虫唾が走るんだよな、ほんとブスだし喋り方もキモい。生理的に無理。",
    tags: ["公然性あり", "対象特定可能"],
  },
  {
    id: "004",
    severity: "high" as const,
    category: "プライバシー侵害",
    law: "民法 709条",
    date: "2026-03-15 12:08",
    likes: 31,
    rt: 9,
    text: "◯◯の本名△△で、△△大学の3年生らしいよ。インスタは @xxxxx だって。",
    tags: ["私事の暴露", "氏名特定"],
  },
  {
    id: "005",
    severity: "medium" as const,
    category: "名誉毀損",
    law: "刑法 230条",
    date: "2026-03-10 21:30",
    likes: 19,
    rt: 4,
    text: "◯◯ってあの会社で横領して辞めさせられたって本当？信じられないわ。",
    tags: ["虚偽の事実", "業務妨害の疑い"],
  },
  {
    id: "006",
    severity: "low" as const,
    category: "侮辱",
    law: "刑法 231条",
    date: "2026-03-05 09:14",
    likes: 6,
    rt: 0,
    text: "馬鹿すぎて話にならない。生きてる価値あるの？",
    tags: ["対象特定", "公然性あり"],
  },
];

const TEMPLATES = [
  { title: "発信者情報開示請求書", desc: "プロバイダ宛・弁護士監修", size: "PDF 124KB" },
  { title: "損害賠償請求書（雛形）", desc: "氏名・日付の記入のみで提出可", size: "PDF 96KB" },
  { title: "証拠保全申立書", desc: "裁判所提出用フォーマット", size: "PDF 158KB" },
  { title: "刑事告訴状（侮辱罪）", desc: "警察署提出用テンプレート", size: "PDF 142KB" },
];

const severityStyle = {
  high: { label: "高", bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
  medium: { label: "中", bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
  low: { label: "低", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
};

// ============================================================
// Page
// ============================================================
export default function PremiumDemoPage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-violet-50/40 via-white to-white">
      {/* ===== Header ===== */}
      <header className="safe-pt sticky top-0 z-20 border-b border-violet-100 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3 sm:px-6">
          <a href="/" className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-text-sub active:scale-[0.96]">
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
        {/* ===== 1. Premium activation banner ===== */}
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
              @{DEMO_USER.handle} の分析結果はロックが解除されました。証拠の保全・PDF出力・弁護士相談がご利用いただけます。
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold backdrop-blur-sm">
                <Calendar className="h-3 w-3" /> 次回更新 {DEMO_USER.nextBilling}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold backdrop-blur-sm">
                <CreditCard className="h-3 w-3" /> ¥500 / 月
              </span>
            </div>
          </div>
        </div>

        {/* ===== 2. Result summary ===== */}
        <section className="mt-5 rounded-3xl border border-border bg-white p-5 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.06)] sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-500 text-xl font-black text-white shadow-lg shadow-red-500/30">
              {DEMO_USER.level}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-[12px] font-semibold text-text-muted">@{DEMO_USER.handle}</p>
              <p className="text-[16px] font-extrabold tracking-tight">開示請求リスク {DEMO_USER.level}（最高レベル）</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase text-text-muted">スコア</p>
              <p className="text-2xl font-black text-red-500">{DEMO_USER.score}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wide text-red-600">問題投稿</p>
              <p className="mt-0.5 text-2xl font-black text-red-600">
                {DEMO_USER.problemPosts}
                <span className="ml-0.5 text-xs font-bold">件</span>
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">分析対象</p>
              <p className="mt-0.5 text-2xl font-black text-text-sub">
                {DEMO_USER.totalPosts}
                <span className="ml-0.5 text-xs font-bold">件</span>
              </p>
            </div>
          </div>
        </section>

        {/* ===== 3. Evidence list (unlocked) ===== */}
        <section className="mt-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-600">UNLOCKED</p>
              <h2 className="mt-1 text-[18px] font-extrabold tracking-tight sm:text-xl">問題投稿 全{EVIDENCE.length}件 / 証拠保全済</h2>
            </div>
            <button className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-white px-3 text-[12px] font-bold text-text-sub active:scale-[0.97]">
              <Download className="h-3.5 w-3.5" />
              一括DL
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {EVIDENCE.map((ev) => {
              const sev = severityStyle[ev.severity];
              return (
                <article
                  key={ev.id}
                  className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)]"
                >
                  {/* Top bar */}
                  <div className="flex items-center gap-2 border-b border-border/70 bg-surface/50 px-4 py-2.5">
                    <span className="text-[11px] font-extrabold text-text-muted">#{ev.id}</span>
                    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-extrabold ${sev.bg} ${sev.text} ${sev.border}`}>
                      {sev.label}
                    </span>
                    <span className="text-[11px] font-bold text-text-sub">{ev.category}</span>
                    <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-violet-50 px-2 py-0.5 text-[10px] font-extrabold text-violet-700">
                      <Scale className="h-2.5 w-2.5" />
                      {ev.law}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="px-4 py-3.5">
                    <p className="text-[10px] font-medium text-text-muted">{ev.date}</p>
                    <p className="mt-2 rounded-xl bg-surface px-3.5 py-3 text-[13px] leading-relaxed text-foreground">
                      {ev.text}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-text-muted">
                      <div className="flex items-center gap-3">
                        <span>♥ {ev.likes}</span>
                        <span>↻ {ev.rt}</span>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        {ev.tags.map((tag) => (
                          <span key={tag} className="rounded border border-border bg-white px-1.5 py-0.5 text-[10px] font-bold text-text-sub">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action bar */}
                  <div className="grid grid-cols-3 gap-px border-t border-border/70 bg-border/50">
                    <button className="flex items-center justify-center gap-1.5 bg-white py-3 text-[11px] font-bold text-text-sub active:bg-surface">
                      <Camera className="h-3.5 w-3.5 text-violet-500" />
                      スクショ
                    </button>
                    <button className="flex items-center justify-center gap-1.5 bg-white py-3 text-[11px] font-bold text-text-sub active:bg-surface">
                      <FileText className="h-3.5 w-3.5 text-indigo-500" />
                      レポート
                    </button>
                    <button className="flex items-center justify-center gap-1.5 bg-white py-3 text-[11px] font-bold text-text-sub active:bg-surface">
                      <ExternalLink className="h-3.5 w-3.5 text-blue-500" />
                      原文
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
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

        {/* ===== 5. Lawyer consultation ===== */}
        <section className="mt-8 overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-violet-50 to-white p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-600">LAWYER CHAT</p>
              <p className="text-[15px] font-extrabold tracking-tight">提携弁護士に無料相談</p>
            </div>
          </div>
          <div className="mt-4 space-y-2.5">
            <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm">
              <p className="text-[10px] font-bold text-indigo-600">山田法律事務所 / 山田弁護士</p>
              <p className="mt-1 text-[13px] leading-relaxed">
                ご相談ありがとうございます。証拠を拝見しました。投稿 #001 と #002 は開示請求が十分通る内容です。次のステップをご説明しますね。
              </p>
            </div>
            <div className="ml-8 rounded-2xl rounded-br-md bg-indigo-500 px-4 py-3 text-white shadow-sm">
              <p className="text-[13px] leading-relaxed">費用感を教えてください。</p>
            </div>
          </div>
          <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-3.5 text-[14px] font-extrabold text-white shadow-lg shadow-indigo-500/30 active:scale-[0.98]">
            <MessageCircle className="h-4 w-4" />
            相談を続ける
          </button>
        </section>

        {/* ===== 6. Plan management ===== */}
        <section className="mt-8 rounded-3xl border border-border bg-white p-5 sm:p-6">
          <h2 className="text-[16px] font-extrabold tracking-tight">プラン管理</h2>
          <div className="mt-4 space-y-2.5">
            {[
              { icon: ShieldCheck, label: "プラン", value: "プレミアム（月額）", color: "text-violet-500" },
              { icon: CreditCard, label: "支払い方法", value: "Visa **** 4242", color: "text-indigo-500" },
              { icon: Calendar, label: "次回更新日", value: DEMO_USER.nextBilling, color: "text-blue-500" },
              { icon: CheckCircle2, label: "ご利用開始日", value: DEMO_USER.joinedAt, color: "text-emerald-500" },
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

        {/* ===== Footer note ===== */}
        <p className="safe-pb mt-8 text-center text-[10.5px] leading-relaxed text-text-muted">
          ※ 本ページはデモ表示です。実際の課金・データ連携は行われません。
          <br />
          本サービスは法的助言を提供するものではありません。
        </p>
      </main>
    </div>
  );
}
