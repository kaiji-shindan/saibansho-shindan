"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 本番では Sentry などに送る
    console.error("[app error]", error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#0a0a1a] via-[#10102a] to-[#141438] px-5 text-center text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[15%] left-[15%] h-[280px] w-[280px] rounded-full bg-rose-500/10 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] h-[260px] w-[260px] rounded-full bg-amber-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-md">
        <Image
          src="/logo_icon.png"
          alt="開示請求診断"
          width={56}
          height={56}
          className="mx-auto opacity-90"
        />
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-rose-300/30 bg-rose-500/10 px-3 py-1">
          <AlertTriangle className="h-3 w-3 text-rose-300" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-rose-300">
            Unexpected Error
          </span>
        </div>
        <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
          エラーが発生しました
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-400">
          予期しない問題が発生しました。お手数ですが、再読み込みをお試しください。
          問題が解決しない場合は、しばらく時間をおいてから再度アクセスしてください。
        </p>

        {error.digest && (
          <p className="mt-4 font-mono text-[10px] text-slate-500">
            Error ID: {error.digest}
          </p>
        )}

        <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-400 to-indigo-400 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-violet-500/30 active:scale-[0.97]"
          >
            <RefreshCw className="h-4 w-4" />
            再試行
          </button>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-bold text-slate-200 backdrop-blur-sm active:scale-[0.97]"
          >
            トップに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
