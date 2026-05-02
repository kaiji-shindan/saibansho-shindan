import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@/components/analytics";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// metadataBase は環境変数 NEXT_PUBLIC_SITE_URL から読む。未設定なら localhost。
// 本番では Vercel 等で必ず設定すること。
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "開示請求診断｜匿名の誹謗中傷は、もう逃げられない",
    template: "%s | 開示請求診断",
  },
  description:
    "気になるXアカウントを入力するだけ、開示請求レベルを診断します。独自エンジンが公開投稿を分析し、誹謗中傷の問題投稿・カテゴリ別法令該当性・開示請求書テンプレートを無料で提供します。",
  keywords: [
    "開示請求",
    "誹謗中傷",
    "発信者情報開示請求",
    "名誉毀損",
    "侮辱罪",
    "X",
    "Twitter",
    "弁護士相談",
    "誹謗中傷対策",
  ],
  icons: {
    icon: "/logo_icon.png",
    apple: "/logo_icon.png",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "開示請求診断｜匿名の誹謗中傷は、もう逃げられない",
    description:
      "気になるXアカウントを入力するだけ、開示請求レベルを診断します。独自エンジンが公開投稿を分析し、誹謗中傷の問題投稿・カテゴリ別法令該当性・開示請求書テンプレートを無料で提供します。",
    type: "website",
    locale: "ja_JP",
    siteName: "開示請求診断",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "開示請求診断｜匿名の誹謗中傷は、もう逃げられない",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "開示請求診断｜匿名の誹謗中傷は、もう逃げられない",
    description:
      "気になるXアカウントを入力するだけ、開示請求レベルを診断します。誹謗中傷の問題投稿・カテゴリ別法令該当性・開示請求書テンプレートを無料で提供。",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
