"""public/ の画像（png / jpg / webp）の小さいサイズを作り置きする（Vercel の画像変換を使わないため。2026-10-17）。

  python3 scripts/make-image-variants.py

→ 元の画像の横に <名前>.w<幅>.webp（384 / 640 / 828 / 1200 のうち元の幅より小さいもの）
→ src/lib/image-variants.json（"/元のパス": [作った幅…]）。src/lib/image-loader.ts がこれを見て選ぶ
作り済み・元より新しいものは飛ばす。新しい画像を足したら打ち直してコミットする（テストが欠けを落とす）。
"""
import json
import os
import re

from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PUBLIC = os.path.join(ROOT, "public")
WIDTHS = (384, 640, 828, 1200)
MIN_BYTES = 100 * 1024  # これより小さい画像はそのまま配る

manifest = {}
made = 0
for dirpath, _, names in os.walk(PUBLIC):
    for name in sorted(names):
        if re.search(r"\.w\d+\.webp$", name):
            continue  # 作り置き自身
        if not name.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
            continue
        path = os.path.join(dirpath, name)
        if os.path.getsize(path) < MIN_BYTES:
            continue
        with Image.open(path) as im:
            w0 = im.width
            base = path.rsplit(".", 1)[0]
            widths = [w for w in WIDTHS if w < w0]
            for w in widths:
                out = f"{base}.w{w}.webp"
                if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(path):
                    continue
                rgba = im.convert("RGBA") if im.mode in ("RGBA", "LA", "P") else im.convert("RGB")
                rgba.resize((w, round(im.height * w / w0)), Image.LANCZOS).save(out, "WEBP", quality=80, method=6)
                made += 1
        if widths:
            manifest["/" + os.path.relpath(path, PUBLIC).replace(os.sep, "/")] = widths

os.makedirs(os.path.join(ROOT, "src/lib"), exist_ok=True)
with open(os.path.join(ROOT, "src/lib/image-variants.json"), "w") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=0, sort_keys=True)
    f.write("\n")
print(f"作り置き: {len(manifest)} 枚の元画像・{made} 枚を作成")
