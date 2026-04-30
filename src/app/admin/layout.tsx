// ============================================================
// /admin layout — 弁護士事務所向けの管理画面共通レイアウト
//
// Basic 認証は src/proxy.ts で実施する。ここに到達している時点で
// 認証は通過しているので chrome のレンダリングだけを行う。
// ============================================================

import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold tracking-tight">
              開示請求診断 <span className="text-violet-600">ADMIN</span>
            </span>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              LAW FIRM ONLY
            </span>
          </div>
          <nav className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <Link href="/admin" className="hover:text-slate-900">ダッシュボード</Link>
            <Link href="/admin/leads" className="hover:text-slate-900">リード一覧</Link>
            {/* CSV は route handler (.csv.ts) なので通常のハードナビゲーション */}
            <a href="/admin/leads.csv" className="rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-50">
              CSV エクスポート
            </a>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
