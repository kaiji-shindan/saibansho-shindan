/**
 * next/image の custom loader（next.config.ts の images.loaderFile）。
 * Vercel の画像変換（/_next/image）は使わない（2026-10-17。無料枠の上限で 402 を返し、画像が切れる）。
 * public/ の重い画像は scripts/make-image-variants.py が作り置きした <名前>.w<幅>.webp から、表示幅に足りる一番小さいものを選ぶ。
 * 一覧（image-variants.json）に無い画像は元の URL のまま。
 */
import variants from "./image-variants.json";

const table = variants as Record<string, number[]>;

export function variantUrl(src: string, width: number): string {
  const widths = table[src];
  if (!widths || widths.length === 0) return src;
  const w = widths.find((v) => v >= width) ?? widths[widths.length - 1];
  return `${src.replace(/\.[^./]+$/, "")}.w${w}.webp`;
}

export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }): string {
  return variantUrl(src, width);
}
