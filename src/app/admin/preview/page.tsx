// ============================================================
// /admin/preview — UI プレビューハブ
//
// クレジット消費なしで各ページのデザインを確認できるリンク集。
// /diagnose/[username]?mock=1 を本番でも許可しているため、
// X / Anthropic / Supabase へのアクセスは発生しない。
// ============================================================

import Link from "next/link";
import { ExternalLink } from "lucide-react";

export const dynamic = "force-static";

interface PreviewLink {
  label: string;
  desc: string;
  href: string;
  badge?: string;
}

const SCENARIOS: PreviewLink[] = [
  {
    label: "診断結果（高リスク）",
    desc: "問題投稿が多数検出されたパターン",
    href: "/diagnose/preview_high?mock=1",
    badge: "Sランク想定",
  },
  {
    label: "診断結果（中リスク）",
    desc: "一部問題投稿が検出されたパターン",
    href: "/diagnose/preview_medium?mock=1",
    badge: "B〜Cランク想定",
  },
  {
    label: "診断結果（低リスク）",
    desc: "問題投稿ほぼ無しのパターン",
    href: "/diagnose/preview_low?mock=1",
    badge: "Eランク想定",
  },
  {
    label: "Premium ページ",
    desc: "詳細レポート（X認証突破済前提）",
    href: "/diagnose/preview_high/premium?mock=1",
    badge: "OAuthガードあり",
  },
];

const PUBLIC_PAGES: PreviewLink[] = [
  { label: "トップ", desc: "ランディングページ", href: "/" },
  { label: "サービスについて", desc: "About / 詳細 LP", href: "/about" },
  { label: "弁護士事務所向け", desc: "B2B 営業 LP", href: "/for-lawyers" },
  { label: "プライバシーポリシー", desc: "/privacy", href: "/privacy" },
  { label: "利用規約", desc: "/terms", href: "/terms" },
  { label: "特商法表記", desc: "/tokushoho", href: "/tokushoho" },
  {
    label: "開示請求書テンプレート",
    desc: "印刷可能な参考フォーマット",
    href: "/templates/disclosure-request",
  },
];

export default function PreviewIndexPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">UI プレビュー</h1>
        <p className="mt-1 text-xs text-slate-500">
          ⚡ <strong>クレジット消費なし</strong>。X API / Anthropic / Supabase
          への通信は発生せず、モックデータでデザインを確認できます。
          リード記録・キャッシュ書き込みも行われません。
        </p>
      </div>

      <section>
        <h2 className="text-sm font-extrabold">診断系ページ（モックデータ）</h2>
        <p className="mt-1 text-[11px] text-slate-500">
          URL に <code className="rounded bg-slate-100 px-1 font-mono">?mock=1</code> を付けると、
          実 API を叩かずモックデータが返ります。本番でも有効。
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {SCENARIOS.map((s) => (
            <PreviewCard key={s.href} {...s} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-extrabold">公開ページ</h2>
        <p className="mt-1 text-[11px] text-slate-500">
          API 連携のない静的ページ。レイアウト確認用。
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PUBLIC_PAGES.map((s) => (
            <PreviewCard key={s.href} {...s} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-extrabold">使い方</h2>
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-700">
          <p>
            ・任意の username で <code className="rounded bg-slate-100 px-1 font-mono">/diagnose/[任意の名前]?mock=1</code>{" "}
            にアクセスすると、その文字列をシードに決定論的なモック診断結果を表示します。
          </p>
          <p className="mt-2">
            ・モックデータは <code className="rounded bg-slate-100 px-1 font-mono">source: &quot;mock&quot;</code> がセットされ、
            UI 上は実 API 結果と同じ見た目になります。
          </p>
          <p className="mt-2">
            ・モックモードでは <code className="rounded bg-slate-100 px-1 font-mono">recordLead</code> が呼ばれず、
            ダッシュボードや leads テーブルに痕跡を残しません。
          </p>
        </div>
      </section>
    </div>
  );
}

function PreviewCard({ label, desc, href, badge }: PreviewLink) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-violet-300 hover:shadow-sm"
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-extrabold text-slate-800 group-hover:text-violet-700">
            {label}
          </p>
          {badge && (
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-1 text-[11px] text-slate-500">{desc}</p>
        <p className="mt-2 truncate font-mono text-[10px] text-slate-400">{href}</p>
      </div>
      <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-slate-400 group-hover:text-violet-500" />
    </Link>
  );
}
