import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Gavel,
  Database,
  MessageCircle,
  BarChart3,
  Shield,
  Zap,
  Users,
  FileText,
  Sparkles,
} from "lucide-react";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "弁護士事務所の方へ",
  description:
    "開示請求診断は、発信者情報開示請求に関するリードを継続的に獲得できる B2B ツールです。ツール売却 / ライセンス提供のご相談を承ります。",
  alternates: { canonical: "/for-lawyers" },
  openGraph: {
    title: "開示請求診断 | 弁護士事務所向け導入案内",
    description:
      "誹謗中傷被害者リードを継続獲得。ツール売却 / ライセンス提供のご案内。",
    type: "article",
  },
};

const VALUE_PROPS = [
  {
    icon: Users,
    title: "継続的なリード獲得",
    description:
      "SNS 広告から誹謗中傷で悩む個人ユーザーを自動で集客し、公式 LINE に流し込む仕組みが整っています。",
  },
  {
    icon: Database,
    title: "管理画面 + CSV エクスポート",
    description:
      "流入したユーザーの X アカウント、UTM キャンペーン、タイムスタンプを管理画面でリアルタイム閲覧・CSV 出力できます。",
  },
  {
    icon: Zap,
    title: "即日導入可能",
    description:
      "ホスティング環境と公式 LINE アカウントをご用意いただければ、最短即日で引き渡し可能です。",
  },
  {
    icon: Shield,
    title: "非弁リスクの最小化",
    description:
      "ユーザー課金を行わず、診断はすべて情報整理ツールとして提供。法的助言を行わない設計になっています。",
  },
];

const WHAT_YOU_GET = [
  "診断エンジン本体（X API v2 + Claude Haiku 分類）",
  "フロントエンド LP + 診断結果ページ",
  "LINE 登録リード獲得フロー",
  "弁護士事務所向け管理画面（ダッシュボード / リスト / CSV）",
  "キャンペーン流入解析（UTM 計測）",
  "Slack / Webhook 通知",
  "診断履歴の Supabase DB スキーマ",
  "運用マニュアル + 初期セットアップ支援",
];

const FLOW = [
  {
    step: "01",
    title: "ユーザーが SNS 広告からランディング",
    desc: "tk 社の法人 X 広告経由で誹謗中傷被害者がサイトに流入します。",
  },
  {
    step: "02",
    title: "無料で診断結果を表示",
    desc: "X アカウント名を入力するだけで開示請求レベル（S〜E）とリスクスコアが即時表示されます。",
  },
  {
    step: "03",
    title: "公式 LINE に誘導してリード化",
    desc: "証拠保全・開示請求テンプレート等の詳細情報は公式 LINE 登録で解放。ここでリードが獲得されます。",
  },
  {
    step: "04",
    title: "管理画面で確認・相談対応",
    desc: "事務所側はリアルタイムに流入を確認し、LINE トークで相談対応を開始できます。",
  },
];

export default function ForLawyersPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-foreground">
      {/* ===== Header ===== */}
      <header className="border-b border-border/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo_icon.png" alt="開示請求診断" width={26} height={26} />
            <span className="text-sm font-extrabold tracking-tight">
              開示請求<span className="text-gradient-blue">診断</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-[11px] font-semibold text-text-sub hover:text-foreground"
            >
              ← サービスを体験する
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ===== Hero ===== */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#0a0a1a] via-[#10102a] to-[#141438] text-white">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 left-1/4 h-[400px] w-[400px] rounded-full bg-violet-500/10 blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 h-[350px] w-[350px] rounded-full bg-indigo-500/10 blur-[120px]" />
          </div>
          <div className="relative mx-auto max-w-5xl px-5 py-20 sm:px-8 sm:py-28">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-violet-500/10 px-3 py-1 text-[11px] font-bold text-violet-300">
              <Sparkles className="h-3 w-3" />
              FOR LAW FIRMS
            </div>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
              発信者情報開示請求の<br />
              <span className="bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent">
                リード獲得ツール
              </span>
              を<br />丸ごと導入
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              SNS 誹謗中傷被害者を広告から自動集客し、公式 LINE 経由で貴事務所のリードに変える、
              ハンズフリー運用可能なウェブツールです。
            </p>

            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-400 to-indigo-400 px-6 py-4 text-sm font-extrabold text-white shadow-xl shadow-violet-500/30 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.97] sm:text-base"
              >
                導入相談する
                <ArrowRight className="h-5 w-5" />
              </a>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-sm font-bold text-slate-200 backdrop-blur-md hover:bg-white/10 active:scale-[0.97] sm:text-base"
              >
                実際の診断を試す
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "弁護士監修対応可", icon: Gavel },
                { label: "即日引渡可", icon: Zap },
                { label: "管理画面付", icon: BarChart3 },
                { label: "Slack通知", icon: MessageCircle },
              ].map((i) => (
                <div
                  key={i.label}
                  className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm"
                >
                  <i.icon className="h-4 w-4 text-violet-300" />
                  <span className="text-xs font-bold text-slate-200">{i.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Problem ===== */}
        <section className="bg-surface py-20 sm:py-24">
          <div className="mx-auto max-w-4xl px-5 sm:px-8">
            <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-gradient-blue">
              The Problem
            </p>
            <h2 className="mt-2 text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
              開示請求案件の集客は、毎回ゼロからの広告運用
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-text-sub sm:text-base">
              2022 年の侮辱罪厳罰化・2024 年の法改正で開示請求への需要は急増しています。
              しかしほとんどの弁護士事務所では、被害者からの問い合わせを
              <strong className="text-foreground">運頼みで待つ</strong>か、
              <strong className="text-foreground">毎回手動で広告を運用</strong>するしかありません。
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { title: "案件単価は高いが", value: "集客コストも高額" },
                { title: "問合せは来るが", value: "契約に至らない比率が高い" },
                { title: "広告は回したいが", value: "運用ノウハウが属人的" },
              ].map((p) => (
                <div
                  key={p.title}
                  className="rounded-2xl border border-border bg-white p-5"
                >
                  <p className="text-xs font-semibold text-text-muted">{p.title}</p>
                  <p className="mt-1 text-base font-extrabold text-foreground">{p.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Value props ===== */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-5xl px-5 sm:px-8">
            <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-gradient-blue">
              Our Solution
            </p>
            <h2 className="mt-2 text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
              診断 → LINE 登録 → リード化の<br className="sm:hidden" />自動化パイプライン
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-text-sub">
              ユーザーが自分の加害者の X アカウントを入力すると、独自エンジンが投稿を分析し、
              法的リスクを可視化します。続く詳細レポートを LINE 登録の動機に変え、
              リードが自動で貴事務所に届きます。
            </p>

            <div className="mt-12 grid gap-5 sm:grid-cols-2">
              {VALUE_PROPS.map((v) => (
                <div
                  key={v.title}
                  className="group rounded-2xl border border-border bg-white p-6 transition-all hover:border-violet-200 hover:shadow-lg hover:shadow-violet-100/50"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100">
                    <v.icon className="h-5 w-5 text-violet-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-extrabold tracking-tight">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-sub">{v.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Flow ===== */}
        <section className="bg-surface py-20 sm:py-24">
          <div className="mx-auto max-w-4xl px-5 sm:px-8">
            <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-gradient-blue">
              Flow
            </p>
            <h2 className="mt-2 text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
              ユーザー体験とリード生成の流れ
            </h2>

            <div className="mt-12 space-y-4">
              {FLOW.map((f) => (
                <div
                  key={f.step}
                  className="flex gap-4 rounded-2xl border border-border bg-white p-5 sm:p-6"
                >
                  <div className="shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 to-indigo-400 text-sm font-black text-white shadow-lg shadow-violet-300/30">
                      {f.step}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-extrabold tracking-tight">{f.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-text-sub">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Admin preview ===== */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-5xl px-5 sm:px-8">
            <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-gradient-blue">
              Admin Panel
            </p>
            <h2 className="mt-2 text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
              管理画面でリードを<br className="sm:hidden" />リアルタイムに把握
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-text-sub">
              Basic 認証で保護された管理画面。診断数・LINE クリック数・キャンペーン別 CVR が
              ワンビューで確認でき、CSV エクスポートも可能です。
            </p>

            {/* Mock admin preview */}
            <div className="mt-12 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-2xl shadow-slate-300/30">
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
                <div className="flex items-center gap-2 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span className="ml-3 font-mono text-[10px] text-slate-400">
                    https://diagnose.example.com/admin
                  </span>
                </div>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-800">
                  LAW FIRM ONLY
                </span>
              </div>

              <div className="p-5 sm:p-6">
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "総診断数", value: "1,248", accent: "text-violet-600" },
                    { label: "ユニークX", value: "892", accent: "text-indigo-600" },
                    { label: "LINE CLICK", value: "312", accent: "text-[#06c755]" },
                    { label: "CVR", value: "25.0%", accent: "text-emerald-600" },
                  ].map((k) => (
                    <div
                      key={k.label}
                      className="rounded-xl border border-slate-200 bg-white p-3"
                    >
                      <p className="text-[9px] font-semibold text-slate-500">{k.label}</p>
                      <p className={`mt-1 text-xl font-black tracking-tight ${k.accent}`}>
                        {k.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-3 py-2 font-semibold">種別</th>
                        <th className="px-3 py-2 font-semibold">Xアカウント</th>
                        <th className="px-3 py-2 font-semibold">キャンペーン</th>
                        <th className="px-3 py-2 font-semibold">時刻</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { kind: "LINE登録", username: "@victim_a", camp: "tk_0411_a", time: "2分前", color: "bg-[#06c755]/20 text-[#04a043]" },
                        { kind: "診断",     username: "@victim_b", camp: "tk_0411_a", time: "5分前", color: "bg-violet-100 text-violet-700" },
                        { kind: "診断",     username: "@victim_c", camp: "tk_0411_b", time: "11分前", color: "bg-violet-100 text-violet-700" },
                        { kind: "LINE登録", username: "@victim_d", camp: "(direct)",   time: "18分前", color: "bg-[#06c755]/20 text-[#04a043]" },
                      ].map((r, i) => (
                        <tr key={i} className="border-t border-slate-100">
                          <td className="px-3 py-2">
                            <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${r.color}`}>
                              {r.kind}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-mono font-bold text-slate-800">{r.username}</td>
                          <td className="px-3 py-2">
                            <span className="rounded bg-amber-50 px-1.5 py-0.5 font-mono text-[9px] text-amber-700">
                              {r.camp}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-500">{r.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== What you get ===== */}
        <section className="bg-surface py-20 sm:py-24">
          <div className="mx-auto max-w-4xl px-5 sm:px-8">
            <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-gradient-blue">
              Deliverables
            </p>
            <h2 className="mt-2 text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
              引渡し時のセット内容
            </h2>

            <div className="mt-10 rounded-3xl border border-border bg-white p-6 sm:p-8">
              <ul className="space-y-3">
                {WHAT_YOU_GET.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                    <span className="text-sm font-medium text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 text-sm leading-relaxed text-amber-900">
              <p className="font-extrabold">※ 非弁リスクについて</p>
              <p className="mt-2">
                本ツールはユーザーに対して法的助言を行わず、情報整理ツールとして機能するよう設計されています。
                導入時に貴事務所側で最終的な法務確認を行っていただくことを推奨します。
              </p>
            </div>
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section id="contact" className="bg-white py-24 sm:py-28">
          <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gradient-blue">
              Contact
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              導入・買取・ライセンスのご相談
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-text-sub sm:text-base">
              料金体系・導入スケジュール・カスタマイズ可否など、
              お気軽にお問い合わせください。初回ヒアリングは無料です。
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <a
                href="https://lin.ee/SKMMS4PJ"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#06c755] to-[#04a043] px-6 py-5 text-sm font-extrabold text-white shadow-xl shadow-[#06c755]/30 hover:opacity-90 active:scale-[0.97] sm:text-base"
              >
                <Image src="/icon_line.png" alt="" width={20} height={20} />
                公式 LINE で相談する
              </a>
              <a
                href="mailto:contact@example.com"
                className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-white px-6 py-5 text-sm font-extrabold text-foreground hover:border-violet-300 hover:shadow-md active:scale-[0.97] sm:text-base"
              >
                <FileText className="h-5 w-5 text-violet-500" />
                メールで問い合わせる
              </a>
            </div>

            <p className="mt-8 text-[11px] text-text-muted">
              ご連絡いただいた内容は秘密保持の上で取り扱い、NDA 締結にも対応します。
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
