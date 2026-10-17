// Vercel の画像変換（/_next/image）を使っていないこと、作り置きがそろっていることを確かめる（build の前に走る。2026-10-17）。
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const errors = [];
const conf = readFileSync("next.config.ts", "utf8");
if (!/loader:\s*"custom"/.test(conf) || !/loaderFile:\s*"\.\/src\/lib\/image-loader\.ts"/.test(conf)) {
  errors.push("next.config.ts が custom loader（./src/lib/image-loader.ts）になっていない");
}
const walk = (d) =>
  readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|css)$/.test(n) ? [p] : [];
  });
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
for (const p of walk("src")) if (stripComments(readFileSync(p, "utf8")).includes("/_next/image")) errors.push(`/_next/image を書いている: ${p}`);
const manifest = JSON.parse(readFileSync("src/lib/image-variants.json", "utf8"));
for (const [src, widths] of Object.entries(manifest)) {
  for (const w of widths) {
    const f = join("public", `${src.replace(/\.[^./]+$/, "")}.w${w}.webp`);
    if (!existsSync(f)) errors.push(`作り置きが無い: ${f}（python3 scripts/make-image-variants.py）`);
  }
}
if (errors.length) {
  console.error("画像の検査 NG:\n  " + errors.join("\n  "));
  process.exit(1);
}
console.log("画像の検査 OK（Vercel の画像変換を使っていない・作り置きがそろっている）");
