import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { getLineAddUrl } from "@/lib/line";

export function Footer() {
  const year = new Date().getFullYear();
  const lineUrl = getLineAddUrl();

  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo_icon.png" alt="ロゴ" width={24} height={24} />
            <span className="text-sm font-bold">
              開示請求<span className="text-gradient-blue">診断</span>
            </span>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-text-muted">
            <Link href="/" className="hover:text-foreground">ホーム</Link>
            <Link href="/about" className="hover:text-foreground">サービスについて</Link>
            <Link href="/terms" className="hover:text-foreground">利用規約</Link>
            <Link href="/privacy" className="hover:text-foreground">プライバシーポリシー</Link>
            <Link href="/tokushoho" className="hover:text-foreground">特定商取引法</Link>
          </div>
        </div>

        {/* LINE CTA */}
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-[#06c755]/30 bg-[#f0fbf1] px-5 py-4 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="text-sm font-extrabold text-foreground">
              公式LINEで詳細レポートを受け取る
            </p>
            <p className="mt-0.5 text-[11px] text-text-muted">
              証拠保全・開示請求テンプレート・詳細レポートまで全て無料
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
        <p className="mt-2 text-center text-[10px] text-text-muted">
          ※ 友だち追加により <Link href="/privacy" className="underline">プライバシーポリシー</Link> に同意したものとみなされます
        </p>

        <div className="mt-6 rounded-lg border border-border bg-surface px-4 py-3">
          <p className="text-[10px] leading-relaxed text-text-muted">
            <strong className="text-text-sub">免責事項：</strong>
            本サービスは法的助言を提供するものではなく、公開投稿の整理・分類ツールです。法的措置の可否については、ご自身でお近くの法律事務所等の専門家にご相談ください。
          </p>
        </div>

        <p className="mt-4 text-center text-[10px] text-text-muted">
          &copy; {year} 開示請求診断 All rights reserved.
        </p>
      </div>
    </footer>
  );
}
