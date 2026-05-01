"use client";

// ============================================================
// LineGate / LineCTA
//
// プレミアムコンテンツの代わりに「公式LINEを開く」を訴求する
// 共通コンポーネント。実態はクリックで LINE 追加 URL を開くだけの
// ソフトゲート (友だち追加の完了検証はしない)。UI 文言もこれに合わせて
// 「開いて開放」ベースで表現する。
// ============================================================

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Sparkles, Lock, CheckCircle2 } from "lucide-react";
import {
  LINE_VERIFIED_COOKIE,
  LINE_VERIFIED_COOKIE_LEGACY,
  LINE_VERIFIED_STORAGE_KEY,
  LINE_VERIFIED_VALUE,
  getLineAddUrl,
} from "@/lib/line";
import { trackEvent } from "./analytics";

/**
 * Read the client-side flag that says "this user already opened the LINE link".
 * Checks localStorage first, then falls back to either the new or legacy cookie.
 */
export function isLineOpenedClient(): boolean {
  if (typeof window === "undefined") return false;
  if (window.localStorage.getItem(LINE_VERIFIED_STORAGE_KEY) === LINE_VERIFIED_VALUE) {
    return true;
  }
  const cookies = document.cookie.split("; ");
  return cookies.some(
    (c) => c.startsWith(`${LINE_VERIFIED_COOKIE}=`) || c.startsWith(`${LINE_VERIFIED_COOKIE_LEGACY}=`),
  );
}

/** Backward-compatible alias. */
export const isLineVerifiedClient = isLineOpenedClient;

/** Hook version — re-renders when the flag flips. */
export function useLineOpened(): [boolean, () => void] {
  // 初期値を localStorage / cookie から直接読む (lazy initializer)
  // これにより SSR では false、ハイドレーション後の 1st render で即反映される
  const [opened, setOpened] = useState<boolean>(() => isLineOpenedClient());
  useEffect(() => {
    // SSR → CSR で値がズレるケース向けに再同期
    const current = isLineOpenedClient();
    if (current !== opened) setOpened(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const markOpened = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LINE_VERIFIED_STORAGE_KEY, LINE_VERIFIED_VALUE);
    }
    setOpened(true);
  }, []);
  return [opened, markOpened];
}

/**
 * Resolve the URL we open when the user clicks "LINEで受け取る".
 *
 * If a LIFF ID is configured, we open the LIFF endpoint with the username
 * pre-filled — that's the path that delivers a personalized message back
 * via the Messaging API. Otherwise we fall back to the plain friend-add URL.
 */
function resolveLineDestination(username?: string): string {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  if (liffId && username) {
    return `https://liff.line.me/${liffId}?username=${encodeURIComponent(username)}`;
  }
  return getLineAddUrl();
}

/**
 * Server-first click recorder. Fire-and-forget, never blocks UX.
 * Also sets the localStorage flag and opens the LINE add URL in a new tab.
 */
export async function openLineAndMarkOpened(username?: string, markOpened?: () => void) {
  const url = resolveLineDestination(username);
  // Optimistically set local flags so the unlock happens immediately.
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LINE_VERIFIED_STORAGE_KEY, LINE_VERIFIED_VALUE);
  }
  markOpened?.();
  trackEvent("LINE Click", username ? { username } : undefined);

  try {
    await fetch("/api/lead/line-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username ?? null }),
      keepalive: true,
    });
  } catch {
    // Best-effort only.
  }
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

// ============================================================
// 1. FREE ページ用 — 大型ゲートカード
// ============================================================
export function LineGateCard({ username }: { username: string }) {
  const [opened, markOpened] = useLineOpened();

  const onClick = () => {
    void openLineAndMarkOpened(username, markOpened);
  };

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-[#06c755]/30 bg-gradient-to-br from-[#f0fbf1] via-white to-[#ecfdf3] p-6 sm:p-7">
      {/* ribbon */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#06c755]/15 px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-[#06c755]">
          <Sparkles className="h-3 w-3" />
          無料で全公開
        </span>
        <span className="text-[10px] font-bold text-text-muted">1タップで開く・完全無料</span>
      </div>

      <p className="mt-3 text-[19px] font-extrabold leading-tight tracking-tight sm:text-[22px]">
        公式LINEから<br className="sm:hidden" />
        <span className="text-[#06c755]">詳細レポート</span>を受け取る
      </p>
      <p className="mt-2 text-[13px] leading-relaxed text-text-sub">
        問題投稿の全件リスト・開示請求書テンプレート・詳細レポートまで、
        すべて公式LINEで受け取れます。課金は一切ありません。
      </p>

      {/* unlocked list */}
      <ul className="mt-4 space-y-2">
        {[
          "問題投稿の全件リストと分類結果",
          "法令別カテゴリ内訳（名誉毀損・侮辱・脅迫・プライバシー侵害）",
          "発信者情報開示請求書の参考フォーマット",
          "PDF形式の証拠レポート出力",
        ].map((label) => (
          <li key={label} className="flex items-start gap-2 text-[13px] text-foreground">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#06c755]" />
            <span>{label}</span>
          </li>
        ))}
      </ul>

      {opened ? (
        <div className="mt-5 flex flex-col gap-2">
          <a
            href={`/diagnose/${username}/premium`}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#06c755] to-[#04a043] px-6 py-4 text-base font-extrabold text-white shadow-lg shadow-[#06c755]/30 active:scale-[0.97]"
          >
            詳細レポートを開く
            <Image src="/icon_line.png" alt="" width={20} height={20} />
          </a>
          <button
            onClick={onClick}
            className="text-[11px] font-medium text-text-muted underline underline-offset-2"
          >
            もう一度 LINE を開く
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={onClick}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#06c755] to-[#04a043] px-6 py-4 text-base font-extrabold text-white shadow-lg shadow-[#06c755]/30 active:scale-[0.97]"
          >
            <Image src="/icon_line.png" alt="" width={20} height={20} />
            LINEで詳細レポートを受け取る
          </button>
          <p className="mt-3 text-center text-[11px] text-text-muted">
            ※ ボタンを押すと LINE が開き、同時に詳細レポートが閲覧できるようになります
          </p>
          <p className="mt-1 text-center text-[10px] text-text-muted">
            ※ 友だち追加により <a href="/privacy" className="underline">プライバシーポリシー</a> に同意したものとみなされます
          </p>
        </>
      )}
    </div>
  );
}

// ============================================================
// 2. Premium ページ用 — フルスクリーンゲート
// ============================================================
export function LineGateOverlay({ username }: { username: string }) {
  const [, markOpened] = useLineOpened();

  const onClick = () => {
    void openLineAndMarkOpened(username, markOpened);
    setTimeout(() => {
      if (typeof window !== "undefined") window.location.reload();
    }, 600);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#f0fbf1] via-white to-[#ecfdf3] px-5 py-10">
      <div className="w-full max-w-md rounded-3xl border border-[#06c755]/30 bg-white p-6 text-center shadow-xl shadow-[#06c755]/10 sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#06c755]/10">
          <Lock className="h-7 w-7 text-[#06c755]" />
        </div>
        <p className="mt-4 text-[12px] font-bold uppercase tracking-wider text-[#06c755]">
          PREMIUM REPORT
        </p>
        <p className="mt-1 text-[22px] font-extrabold leading-tight tracking-tight">
          公式LINEを開いて<br />
          すべて無料で受け取る
        </p>
        <p className="mt-3 text-sm leading-relaxed text-text-sub">
          @{username} の全問題投稿リスト・開示請求書テンプレート・
          詳細レポートまでまとめて確認できます。課金は一切ありません。
        </p>

        <ul className="mt-5 space-y-2 text-left">
          {[
            "問題投稿の全件リスト",
            "法令別カテゴリ内訳",
            "発信者情報開示請求書テンプレート",
            "PDF形式の証拠レポート",
          ].map((l) => (
            <li key={l} className="flex items-start gap-2 text-[13px]">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#06c755]" />
              <span>{l}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={onClick}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#06c755] to-[#04a043] px-6 py-4 text-base font-extrabold text-white shadow-lg shadow-[#06c755]/30 active:scale-[0.97]"
        >
          <Image src="/icon_line.png" alt="" width={20} height={20} />
          LINEで詳細レポートを受け取る
        </button>
        <p className="mt-2 text-center text-[10px] text-text-muted">
          ※ 友だち追加により <a href="/privacy" className="underline">プライバシーポリシー</a> に同意したものとみなされます
        </p>

        <a
          href={`/diagnose/${username}`}
          className="mt-3 inline-block text-[11px] font-medium text-text-muted underline underline-offset-2"
        >
          ← 無料診断結果に戻る
        </a>
      </div>
    </div>
  );
}
