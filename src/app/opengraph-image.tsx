// ============================================================
// Root OG image — 1200x630
// X 広告経由で LP がシェアされたときのサムネ。
// next/og (Satori) は全ての div に明示的 display:flex を要求する。
// ============================================================

import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "開示請求診断 — あの誹謗中傷、検討材料をAIで整理";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px 90px",
          background:
            "linear-gradient(135deg, #10102a 0%, #141438 50%, #1a1a45 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top: brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 14,
              background: "linear-gradient(135deg, #a78bfa, #818cf8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              fontWeight: 900,
            }}
          >
            ⚖
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: -0.5,
              color: "#ffffff",
            }}
          >
            開示請求診断
          </div>
        </div>

        {/* Middle: headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              display: "flex",
              fontSize: 76,
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            あの誹謗中傷、
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 76,
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: -2,
              color: "#a78bfa",
            }}
          >
            検討材料をAIで整理
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 10,
              fontSize: 30,
              color: "#94a3b8",
              fontWeight: 500,
            }}
          >
            Xアカウントを入力するだけで、開示請求の材料を無料整理
          </div>
        </div>

        {/* Bottom: pills */}
        <div style={{ display: "flex", gap: 14 }}>
          {["無料", "登録不要", "S〜E 判定", "X API 連携"].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                padding: "12px 24px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(167,139,250,0.25)",
                fontSize: 24,
                fontWeight: 700,
                color: "#c4b5fd",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
