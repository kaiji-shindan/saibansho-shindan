import type { Metadata } from "next";
import { DiagnoseClient } from "./client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const handle = decodeURIComponent(username).slice(0, 32);
  const title = `@${handle} の開示請求レベル参考表示`;
  const description = `@${handle} の公開投稿を独自AIエンジンで分析し、開示請求の検討材料を無料で整理します。`;

  return {
    title,
    description,
    alternates: {
      canonical: `/diagnose/${handle}`,
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
