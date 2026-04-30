// ============================================================
// /admin layout — 弁護士事務所向けの管理画面共通レイアウト
//
// Basic 認証は src/proxy.ts で実施する。ここに到達している時点で
// 認証は通過しているので chrome のレンダリングだけを行う。
// ============================================================

import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, Users, FileDown } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-0 lg:h-screen w-full lg:w-60 shrink-0 border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col">
            {/* Brand */}
            <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
              <Image
                src="/logo_icon2.png"
                alt="開示請求診断"
                width={28}
                height={28}
                className="rounded-full"
              />
              <span className="text-sm font-extrabold tracking-tight">
                開示請求診断 <span className="text-violet-600">ADMIN</span>
              </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
              <Link
                href="/admin"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              >
                <LayoutDashboard className="h-4 w-4" />
                ダッシュボード
              </Link>
              <Link
                href="/admin/leads"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              >
                <Users className="h-4 w-4" />
                リード一覧
              </Link>
              <a
                href="/admin/leads.csv"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              >
                <FileDown className="h-4 w-4" />
                CSV エクスポート
              </a>
            </nav>

            {/* Footer note */}
            <div className="border-t border-slate-200 px-5 py-3 text-[10px] text-slate-500">
              閲覧専用 / 法律事務所向け
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
