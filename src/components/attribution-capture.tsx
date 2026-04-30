"use client";

// ============================================================
// AttributionCapture
//
// ランディング時に URL の utm_* パラメータを読み取り、
// kaiji_attr cookie に 180 日間保存する。
// 一度保存されたら上書きしない (first-touch attribution)。
//
// tk 社の法人 X 広告から流入したユーザーを 診断/LINE クリック の
// タイミングで正しいキャンペーンに紐付けるために使う。
// ============================================================

import { useEffect } from "react";

const COOKIE = "kaiji_attr";
const MAX_AGE = 60 * 60 * 24 * 180; // 180日

export function AttributionCapture() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 既に設定済みなら上書きしない (first-touch)
    const already = document.cookie.split("; ").some((c) => c.startsWith(COOKIE + "="));
    if (already) return;

    const url = new URL(window.location.href);
    const params = new URLSearchParams();
    const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
    let hasAny = false;
    for (const k of keys) {
      const v = url.searchParams.get(k);
      if (v) {
        params.set(k, v);
        hasAny = true;
      }
    }
    // 直接流入でも landing_path は残す (どの LP から来たかの記録)
    params.set("landing_path", url.pathname);

    // 直接流入 (UTM 無し) は cookie を設定しない — (direct) 扱い
    if (!hasAny) return;

    // 本番 (HTTPS) では Secure 属性を付ける
    const isSecure =
      typeof window !== "undefined" && window.location.protocol === "https:";
    const secureAttr = isSecure ? "; Secure" : "";
    document.cookie = `${COOKIE}=${params.toString()}; path=/; max-age=${MAX_AGE}; SameSite=Lax${secureAttr}`;
  }, []);

  return null;
}
