// ============================================================
// Dynamic OG image per diagnosed username
// 結果ページが X シェアされたときに "@username のリスク" を
// サムネで見せてクリック率を上げる。
// 不正な username (全角等) の場合は @ を出さない汎用版にフォールバック。
// ============================================================

import { ImageResponse } from "next/og";
import { isValidXUsername } from "@/lib/parse-username";

export const runtime = "nodejs";
export const alt = "開示請求診断 — 結果レポート";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: { username: string };
}) {
  const raw = decodeURIComponent(params.username).replace(/^@/, "");
  const validUsername = isValidXUsername(raw) ? raw : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "70px 90px",
          background:
            "linear-gradient(135deg, #10102a 0%, #141438 50%, #1a1a45 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "linear-gradient(135deg, #a78bfa, #818cf8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 900,
            }}
          >
            ⚖
          </div>
          <div style={{ display: "flex", fontSize: 24, fontWeight: 800, color: "#ffffff" }}>
            開示請求診断
          </div>
        </div>

        {/* Username + verdict */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", fontSize: 36, color: "#94a3b8", fontWeight: 600 }}>
            {validUsername ? "診断対象アカウント" : "Xアカウントの開示請求レベルを判定"}
          </div>
          {validUsername ? (
            <div
              style={{
                display: "flex",
                fontSize: 92,
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: -2,
                color: "#a78bfa",
              }}
            >
              @{validUsername}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                fontSize: 72,
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: -2,
                color: "#a78bfa",
              }}
            >
              その誹謗中傷、開示請求かも？
            </div>
          )}
          <div
            style={{
              display: "flex",
              marginTop: 14,
              fontSize: 40,
              fontWeight: 800,
              color: "#f87171",
            }}
          >
            {validUsername
              ? "開示請求レベルを分析しました"
              : "公開投稿をAIで分析・無料診断"}
          </div>
        </div>

        {/* Footer CTA */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "18px 28px",
            borderRadius: 18,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(167,139,250,0.25)",
            alignSelf: "flex-start",
          }}
        >
          <div style={{ display: "flex", fontSize: 24, color: "#c4b5fd", fontWeight: 700 }}>
            あなたも無料で診断できる →
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
