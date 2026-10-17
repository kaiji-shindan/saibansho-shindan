import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Vercel の画像変換（/_next/image）は使わない（2026-10-17。チームの無料枠の上限で 402 を返し、画像が切れる）。
    // 重い画像は scripts/make-image-variants.py の作り置きを src/lib/image-loader.ts が選ぶ。外部の画像は元の URL のまま。
    // build の前に scripts/check-no-image-optimizer.mjs が検査する
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "unavatar.io",
      },
      {
        protocol: "https",
        hostname: "pbs.twimg.com",
      },
    ],
  },
};

export default nextConfig;
