// ============================================================
// SiteFooter — 全ページ共通フッター
//
// 法的ページ・LINE/X 公式アカウントへの導線を集約。
// ============================================================

import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { getLineAddUrl } from "@/lib/line";

interface SiteFooterProps {
  /** 暗色背景に乗せる場合は "dark" */
  tone?: "light" | "dark";
}

export function SiteFooter({ tone = "light" }: SiteFooterProps) {
  const isDark = tone === "dark";
  const base = isDark
    ? "bg-[#0a0a1a] text-slate-400 border-t border-white/5"
    : "bg-white text-text-sub border-t border-border";
  const linkCls = isDark
    ? "text-slate-400 hover:text-white"
    : "text-text-sub hover:text-foreground";
  const subtle = isDark ? "text-slate-500" : "text-text-muted";

  const lineUrl = getLineAddUrl();

  return (
    <footer className={`${base} safe-pb relative`}>
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2">
              <Image src="/logo_icon.png" alt="開示請求診断" width={28} height={28} />
              <span className={`text-sm font-extrabold ${isDark ? "text-white" : "text-foreground"}`}>
                開示請求<span className="text-gradient-blue">診断</span>
              </span>
            </div>
            <p className={`mt-3 text-xs leading-relaxed ${subtle} max-w-sm`}>
              Xアカウントの公開投稿を独自エンジンで分析し、法的リスクの可能性を整理する情報ツールです。
              最終的な法的判断は、ご自身でお近くの法律事務所等の専門家にご相談ください。
            </p>
          </div>

          {/* Links */}
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${subtle}`}>サービス</p>
            <ul className="mt-3 space-y-2 text-xs">
              <li><Link href="/" className={linkCls}>ホーム</Link></li>
              <li><Link href="/about" className={linkCls}>サービスについて</Link></li>
            </ul>
          </div>

          <div>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${subtle}`}>法的情報</p>
            <ul className="mt-3 space-y-2 text-xs">
              <li><Link href="/privacy" className={linkCls}>プライバシーポリシー</Link></li>
              <li><Link href="/terms" className={linkCls}>利用規約</Link></li>
              <li><Link href="/tokushoho" className={linkCls}>特定商取引法に基づく表記</Link></li>
            </ul>
          </div>
        </div>

        {/* LINE CTA */}
        <div className={`mt-8 flex flex-col items-center gap-3 rounded-2xl border px-5 py-4 sm:flex-row sm:justify-between ${
          isDark ? "border-[#06c755]/30 bg-[#06c755]/5" : "border-[#06c755]/30 bg-[#f0fbf1]"
        }`}>
          <div className="text-center sm:text-left">
            <p className={`text-sm font-extrabold ${isDark ? "text-white" : "text-foreground"}`}>
              公式LINEで詳細レポートを受け取る
            </p>
            <p className={`mt-0.5 text-[11px] ${subtle}`}>
              証拠保全・開示請求テンプレート・詳細レポートまで、すべて無料
            </p>
          </div>
          <a
            href={lineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#06c755] to-[#04a043] px-5 py-2.5 text-xs font-extrabold text-white shadow-md shadow-[#06c755]/30 active:scale-[0.97]"
          >
            <MessageCircle className="h-4 w-4" />
            友だち追加
          </a>
        </div>
        <p className={`mt-2 text-center text-[10px] ${subtle}`}>
          ※ 友だち追加により <Link href="/privacy" className="underline">プライバシーポリシー</Link> に同意したものとみなされます
        </p>

        <div className={`mt-8 flex flex-col items-center justify-between gap-2 border-t pt-6 text-[10px] ${subtle} ${
          isDark ? "border-white/5" : "border-border"
        } sm:flex-row`}>
          <p>© {new Date().getFullYear()} 開示請求診断</p>
          <p>
            本サービスは法的助言を提供するものではありません。最終判断はご自身でお近くの法律事務所等の専門家にご相談ください。
          </p>
        </div>
      </div>
    </footer>
  );
}
