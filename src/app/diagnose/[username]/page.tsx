import type { Metadata } from "next";
import { DiagnoseClient } from "./client";
import { isValidXUsername } from "@/lib/parse-username";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const raw = decodeURIComponent(username).replace(/^@/, "");

  // 不正な username (全角等) の場合は汎用メタデータを返し、
  // クローラに対しても noindex を指定する。@さざえ125 のような
  // ゴミタイトルを Twitter Card 等に拡散させないため。
  if (!isValidXUsername(raw)) {
    return {
      title: "開示請求診断",
      description:
        "気になるXアカウントを入力するだけ。公開投稿をAIが分析し、開示請求の検討材料を無料で整理します。",
      robots: { index: false, follow: false },
    };
  }

  const title = `@${raw} の開示請求レベル参考表示`;
  const description = `@${raw} の公開投稿を独自AIエンジンで分析し、開示請求の検討材料を無料で整理します。`;

  return {
    title,
    description,
    alternates: {
      canonical: `/diagnose/${raw}`,
    },
    openGraph: {
      title,
      description,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function DiagnosePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return <DiagnoseClient username={username} />;
}
