// ============================================================
// Analytics — Plausible (opt-in via env)
//
// NEXT_PUBLIC_PLAUSIBLE_DOMAIN が設定されていれば読み込む。
// Next の Script コンポーネントで defer 読み込み。
// /admin 以下やエラーページには入れない (layout.tsx 経由で全体に効くが、
//  admin はレイアウトが別なので自然に除外される)。
// ============================================================

import Script from "next/script";

export function Analytics() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return null;

  return (
    <>
      <Script
        defer
        data-domain={domain}
        src="https://plausible.io/js/script.outbound-links.tagged-events.js"
        strategy="afterInteractive"
      />
      {/* `plausible()` を window で呼べるようにする wrapper */}
      <Script
        id="plausible-init"
        strategy="afterInteractive"
      >{`
        window.plausible = window.plausible || function() {
          (window.plausible.q = window.plausible.q || []).push(arguments);
        };
      `}</Script>
    </>
  );
}

// ============================================================
// Helper to emit custom events from client components.
// Silently no-ops when Plausible is not loaded.
// ============================================================
type PlausibleFn = (event: string, options?: { props?: Record<string, string | number> }) => void;
declare global {
  interface Window {
    plausible?: PlausibleFn;
  }
}

export function trackEvent(event: string, props?: Record<string, string | number>) {
  if (typeof window === "undefined") return;
  try {
    window.plausible?.(event, props ? { props } : undefined);
  } catch {
    // never throw from analytics
  }
}
