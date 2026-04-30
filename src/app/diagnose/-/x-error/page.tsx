import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

const REASON_LABEL: Record<string, string> = {
  missing_code_or_state: "認可コードが返ってきませんでした",
  no_cookie_state: "認証セッションが切れました。もう一度お試しください",
  state_mismatch: "セキュリティチェックに失敗しました。もう一度お試しください",
  token_exchange_failed: "X とのトークン交換に失敗しました。時間を置いて再試行してください",
};

export default async function XErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const sp = await searchParams;
  const reason = sp.reason ?? "unknown";
  const label =
    REASON_LABEL[reason] ??
    (reason.startsWith("x_returned_") ? `X 側からエラー: ${reason.replace("x_returned_", "")}` : "不明なエラー");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#0a0a1a] to-[#141438] px-5 text-center text-white">
      <div className="max-w-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/15">
          <AlertTriangle className="h-7 w-7 text-rose-300" />
        </div>
        <p className="mt-5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-rose-300">
          X AUTH ERROR
        </p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
          X 連携でエラーが発生しました
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-400">{label}</p>
        <p className="mt-2 font-mono text-[10px] text-slate-500">code: {reason}</p>

        <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-400 to-indigo-400 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-violet-500/30 active:scale-[0.97]"
          >
            <ArrowLeft className="h-4 w-4" />
            トップに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
