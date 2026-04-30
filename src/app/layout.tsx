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
    default: "開示請求診断 | あの誹謗中傷、開示請求の検討材料を整理",
    template: "%s | 開示請求診断",
  },
  description:
    "Xアカウントを入力するだけ。独自エンジンが公開投稿を分析し、発信者情報開示請求の検討材料を無料で整理します。登録不要・完全無料。",
  keywords: [
    "開示請求",
    "誹謗中傷",
    "発信者情報開示請求",
    "名誉毀損",
    "侮辱罪",
    "弁護士",
    "X",
    "Twitter",
    "診断",
  ],
  icons: {
    icon: "/logo_icon.png",
    apple: "/logo_icon.png",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "開示請求診断 | 検討材料をAIで整理",
    description:
      "Xアカウントを入力するだけ。独自エンジンが公開投稿を分析し、開示請求の検討材料を無料で整理します。",
    type: "website",
    locale: "ja_JP",
    siteName: "開示請求診断",
  },
  twitter: {
    card: "summary_large_image",
    title: "開示請求診断 | 検討材料をAIで整理",
    description: "Xアカウントの公開投稿をAIで分析し、開示請求の検討材料を無料で整理します。",
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
