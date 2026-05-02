"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type Status =
  | "init"        // LIFF SDK 読み込み中
  | "registering" // サーバーに登録リクエスト中
  | "delivered"   // 既に友だち登録済み → メッセージ送信完了
  | "needsAdd"    // 友だち追加が必要 (Aggressive bot link で追加プロンプトが出る)
  | "missingArg"  // username パラメータが無い
  | "error";

interface LiffSdk {
  init: (cfg: { liffId: string }) => Promise<void>;
  ready: Promise<void>;
  isLoggedIn: () => boolean;
  login: (cfg?: { redirectUri?: string }) => void;
  isInClient: () => boolean;
  getProfile: () => Promise<{ userId: string; displayName?: string }>;
  closeWindow?: () => void;
}

declare global {
  interface Window {
    liff?: LiffSdk;
  }
}

const LIFF_SDK_SRC = "https://static.line-scdn.net/liff/edge/2/sdk.js";

const LIFF_PENDING_USERNAME_KEY = "kaiji_liff_pending_username";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split("; ");
  for (const c of cookies) {
    const eq = c.indexOf("=");
    if (eq > -1 && c.substring(0, eq) === name) {
      return decodeURIComponent(c.substring(eq + 1));
    }
  }
  return null;
}

/**
 * Resolve the diagnose target username from multiple channels.
 *
 * LIFF strips/wraps custom query params during the in-LINE-app redirect,
 * so we look in:
 *   1) The Next.js searchParams (`initial`) — works in plain browsers
 *   2) `?username=...` on the live URL after liff.init()
 *   3) `?liff.state=username%3D...` inside liff.state
 *   4) `kaiji_liff_pending_username` cookie (set by line-gate before opening LIFF)
 *   5) localStorage with the same key
 */
function resolveUsernameFromUrl(initial: string): string {
  if (initial) return initial;
  if (typeof window === "undefined") return "";

  // 2) Plain ?username=
  const params = new URLSearchParams(window.location.search);
  const direct = params.get("username");
  if (direct) return direct;

  // 3) liff.state wrapped
  const stateRaw = params.get("liff.state");
  if (stateRaw) {
    const stateStr = stateRaw.startsWith("?") ? stateRaw.substring(1) : stateRaw;
    const stateParams = new URLSearchParams(stateStr);
    const inState = stateParams.get("username");
    if (inState) return inState;
  }

  // 4) Cookie set by line-gate before opening LIFF
  const cookieValue = readCookie(LIFF_PENDING_USERNAME_KEY);
  if (cookieValue) return cookieValue;

  // 5) localStorage (works in same-origin contexts)
  try {
    const stored = window.localStorage.getItem(LIFF_PENDING_USERNAME_KEY);
    if (stored) return stored;
  } catch {
    // localStorage may be blocked
  }

  return "";
}

export function LiffClient({ username: initialUsername }: { username: string }) {
  const [username, setUsername] = useState<string>(initialUsername);
  const [status, setStatus] = useState<Status>("init");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

    if (!liffId) {
      setStatus("error");
      setErrorMessage("LIFF ID が設定されていません");
      return;
    }

    const run = async () => {
      try {
        // 1) Inject LIFF SDK if not present
        if (!window.liff) {
          await new Promise<void>((resolve, reject) => {
            const s = document.createElement("script");
            s.src = LIFF_SDK_SRC;
            s.charset = "utf-8";
            s.onload = () => resolve();
            s.onerror = () => reject(new Error("LIFF SDK の読み込みに失敗しました"));
            document.head.appendChild(s);
          });
        }

        const liff = window.liff!;
        await liff.init({ liffId });
        if (cancelled) return;

        // After liff.init the URL's liff.state is processed; re-read username.
        const resolvedUsername = resolveUsernameFromUrl(initialUsername);
        if (!resolvedUsername) {
          setStatus("missingArg");
          return;
        }
        setUsername(resolvedUsername);

        // 2) Ensure logged in (browser path; in LINE app it's already logged in)
        if (!liff.isLoggedIn()) {
          liff.login();
          return; // login() redirects; bail.
        }

        // 3) Get profile
        const profile = await liff.getProfile();
        if (cancelled) return;

        setStatus("registering");

        // 4) Send to backend
        const res = await fetch("/api/line/register-pending", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: profile.userId,
            username: resolvedUsername,
            displayName: profile.displayName ?? null,
          }),
        });
        const json = await res.json();
        if (cancelled) return;

        if (!json.ok) {
          setStatus("error");
          setErrorMessage(json.error ?? "サーバーエラー");
          return;
        }

        setStatus(json.sent ? "delivered" : "needsAdd");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "不明なエラー");
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUsername]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#f0fbf1] via-white to-[#ecfdf3] px-5 py-10">
      <div className="w-full max-w-md rounded-3xl border border-[#06c755]/30 bg-white p-6 text-center shadow-xl shadow-[#06c755]/10 sm:p-8">
        {/* Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#06c755]/10">
          {status === "delivered" ? (
            <CheckCircle2 className="h-8 w-8 text-[#06c755]" />
          ) : status === "error" || status === "missingArg" ? (
            <AlertCircle className="h-8 w-8 text-amber-500" />
          ) : status === "needsAdd" ? (
            <Image src="/icon_line.png" alt="LINE" width={36} height={36} />
          ) : (
            <Loader2 className="h-8 w-8 text-[#06c755] animate-spin" />
          )}
        </div>

        {/* Title + body */}
        {status === "init" && (
          <>
            <p className="mt-4 text-[18px] font-extrabold leading-tight tracking-tight">
              準備しています...
            </p>
            <p className="mt-2 text-sm text-text-sub">LINE と連携中です</p>
          </>
        )}

        {status === "registering" && (
          <>
            <p className="mt-4 text-[18px] font-extrabold leading-tight tracking-tight">
              詳細レポートを送信しています...
            </p>
            <p className="mt-2 text-sm text-text-sub">少々お待ちください</p>
          </>
        )}

        {status === "delivered" && (
          <>
            <p className="mt-4 text-[20px] font-extrabold leading-tight tracking-tight">
              送信完了 ✅
            </p>
            <p className="mt-3 text-sm leading-relaxed text-text-sub">
              <strong className="text-foreground">@{username}</strong> の詳細レポートを
              <br />LINE のトーク画面にお送りしました。
            </p>
            <p className="mt-4 text-[12px] text-text-muted">
              このウィンドウは閉じて、LINE のトークをご確認ください。
            </p>
          </>
        )}

        {status === "needsAdd" && (
          <>
            <p className="mt-4 text-[20px] font-extrabold leading-tight tracking-tight">
              友だち追加で受け取る
            </p>
            <p className="mt-3 text-sm leading-relaxed text-text-sub">
              公式 LINE を友だち追加すると、
              <br />
              <strong className="text-foreground">@{username}</strong> の詳細レポートが
              <br />
              トーク画面に届きます。
            </p>
            <p className="mt-3 text-[12px] text-text-muted">
              この画面が開いている間に、上部に表示される「追加」ボタンをタップしてください。
            </p>
            <a
              href={
                process.env.NEXT_PUBLIC_LINE_ADD_FRIEND_URL ??
                "https://line.me/R/ti/p/@example"
              }
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#06c755] to-[#04a043] px-6 py-4 text-base font-extrabold text-white shadow-lg shadow-[#06c755]/30 active:scale-[0.97]"
            >
              <Image src="/icon_line.png" alt="" width={20} height={20} />
              友だち追加する
            </a>
          </>
        )}

        {status === "missingArg" && (
          <>
            <p className="mt-4 text-[18px] font-extrabold leading-tight tracking-tight">
              診断対象が指定されていません
            </p>
            <p className="mt-2 text-sm text-text-sub">
              診断ページからお進みください。
            </p>
            <a
              href="/"
              className="mt-5 inline-block rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-bold"
            >
              トップに戻る
            </a>
          </>
        )}

        {status === "error" && (
          <>
            <p className="mt-4 text-[18px] font-extrabold leading-tight tracking-tight">
              エラーが発生しました
            </p>
            <p className="mt-2 text-sm text-text-sub">{errorMessage}</p>
            <p className="mt-3 text-[12px] text-text-muted">
              再度お試しいただくか、ブラウザでトップから操作してください。
            </p>
          </>
        )}
      </div>
    </div>
  );
}
