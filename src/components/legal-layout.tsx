// ============================================================
// LegalLayout — /privacy /terms /tokushoho の共通シェル
// ============================================================

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteFooter } from "./site-footer";

interface LegalLayoutProps {
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  children: React.ReactNode;
}

export function LegalLayout({
  title,
  subtitle,
  lastUpdated,
  children,
}: LegalLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="border-b border-border bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-text-sub hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            戻る
          </Link>
          <div className="flex items-center gap-1.5">
            <Image src="/logo_icon.png" alt="開示請求診断" width={22} height={22} />
            <span className="text-sm font-extrabold">
              開示請求<span className="text-gradient-blue">診断</span>
            </span>
          </div>
          <div className="w-12" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
        <div className="rounded-3xl border border-border bg-white p-6 sm:p-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gradient-blue">
            Legal
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-text-sub">{subtitle}</p>}
          {lastUpdated && (
            <p className="mt-3 text-[11px] text-text-muted">最終更新日: {lastUpdated}</p>
          )}

          <div className="prose-legal mt-8">{children}</div>
        </div>

        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-[11px] leading-relaxed text-amber-900">
          <p className="font-bold">⚠️ ドラフト版について</p>
          <p className="mt-1">
            本ページの内容は初期ドラフトです。実運用にあたっては必ず弁護士による確認・修正を経てから公開してください。
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
