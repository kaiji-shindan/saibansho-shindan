// ============================================================
// /diagnose/[username]/premium — server entry
//
// Server-side X OAuth gate:
//   - 未認証 → /api/auth/x/start にリダイレクト
//   - 別人の X でログイン中 → 所有者不一致 UI を表示（再ログイン誘導）
//   - 認証済み + 所有者一致 → PremiumClient をレンダリング
// ============================================================

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogIn, AlertCircle } from "lucide-react";
import { PremiumClient } from "./client";
import { isXOauthConfigured } from "@/lib/x-oauth";

export const dynamic = "force-dynamic";

export default async function PremiumPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ mock?: string }>;
}) {
  const { username } = await params;
  const sp = await searchParams;

  // ?mock=1 は admin の UI プレビュー用。X OAuth ガードをスキップして
  // モックデータでそのまま表示する（PremiumClient 内で /api/diagnose?mock=1
  // が呼ばれるため、X / Anthropic / Supabase は一切叩かれない）。
  if (sp.mock === "1") {
    return <PremiumClient username={username} />;
  }

  const cookieStore = await cookies();
  const xHandle = cookieStore.get("kaiji_x_handle")?.value;

  // X OAuth が未設定なら、ガード OFF（開発時のフォールバック）
  if (!isXOauthConfigured()) {
    return <PremiumClient username={username} />;
  }

  // 未ログイン → X OAuth へ
  if (!xHandle) {
    return <XAuthRequired username={username} />;
  }

  // 所有者不一致
  if (xHandle.toLowerCase() !== username.toLowerCase()) {
    return <OwnershipMismatch authedAs={xHandle} target={username} />;
  }

  // 認証済 + 一致 → 通常表示
  return <PremiumClient username={username} />;
}

// ============================================================
// X 認証が必要な状態のフルスクリーン UI
// ============================================================
function XAuthRequired({ username }: { username: string }) {
  const returnTo = `/diagnose/${encodeURIComponent(username)}/premium`;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 via-white to-slate-50 px-5 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-xl shadow-slate-300/30 sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900">
          <LogIn className="h-7 w-7 text-white" />
        </div>
        <p className="mt-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">
          X 認証が必要です
        </p>
        <p className="mt-1 text-[22px] font-extrabold leading-tight tracking-tight">
          ご本人確認のため<br />X でログインしてください
        </p>
        <p className="mt-3 text-sm leading-relaxed text-text-sub">
          詳細レポートには <strong className="text-foreground">@{username}</strong> 本人のみが
          閲覧できる情報が含まれています。
          <br />
          ご自身の X アカウントでログインしてください。
        </p>

        <a
          href={`/api/auth/x/start?return=${encodeURIComponent(returnTo)}`}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 text-base font-extrabold text-white shadow-lg shadow-slate-900/30 hover:opacity-90 active:scale-[0.97]"
        >
          <span className="text-lg leading-none">𝕏</span>
          X でログインして閲覧する
        </a>

        <Link
          href={`/diagnose/${encodeURIComponent(username)}`}
          className="mt-3 inline-block text-[11px] font-medium text-text-muted underline underline-offset-2"
        >
          ← 無料診断結果に戻る
        </Link>

        <div className="mt-6 rounded-xl bg-slate-50 p-3 text-left">
          <p className="text-[10px] leading-relaxed text-slate-500">
            <strong className="text-slate-700">なぜ X 認証が必要？</strong>
            <br />
            他人の詳細データを第三者が閲覧できないようにするためです。診断対象アカウントの
            本人のみが詳細レポートを閲覧できるよう制限しています。
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 別人の X でログイン中の UI
// ============================================================
function OwnershipMismatch({
  authedAs,
  target,
}: {
  authedAs: string;
  target: string;
}) {
  const returnTo = `/diagnose/${encodeURIComponent(target)}/premium`;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-amber-50 via-white to-amber-50/50 px-5 py-10">
      <div className="w-full max-w-md rounded-3xl border border-amber-200 bg-white p-6 text-center shadow-xl shadow-amber-300/30 sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
          <AlertCircle className="h-8 w-8 text-amber-600" />
        </div>
        <p className="mt-4 text-[12px] font-bold uppercase tracking-wider text-amber-700">
          ログイン中のアカウントが異なります
        </p>
        <p className="mt-1 text-[20px] font-extrabold leading-tight tracking-tight">
          ご本人のアカウントでのみ閲覧可能です
        </p>
        <div className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-4 text-left">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">現在のログイン</p>
            <p className="mt-0.5 font-mono text-sm font-bold text-slate-700">@{authedAs}</p>
          </div>
          <div className="border-t border-slate-200" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">レポートのアカウント</p>
            <p className="mt-0.5 font-mono text-sm font-bold text-amber-700">@{target}</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-text-sub">
          詳細レポートはアカウント本人のみが閲覧できます。
          <br />
          <strong className="text-foreground">@{target}</strong> としてログインし直してください。
        </p>

        <a
          href={`/api/auth/x/start?return=${encodeURIComponent(returnTo)}`}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 text-base font-extrabold text-white shadow-lg shadow-slate-900/30 hover:opacity-90 active:scale-[0.97]"
        >
          <span className="text-lg leading-none">𝕏</span>
          別の X アカウントでログインする
        </a>

        <Link
          href={`/diagnose/${encodeURIComponent(target)}`}
          className="mt-3 inline-block text-[11px] font-medium text-text-muted underline underline-offset-2"
        >
          ← 無料診断結果に戻る
        </Link>
      </div>
    </div>
  );
}
