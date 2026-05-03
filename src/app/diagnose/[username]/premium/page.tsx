// ============================================================
// /diagnose/[username]/premium — server entry
//
// ゲートの順番 (LINE → X 本人認証):
//   1. ?mock=1 → 全ガード bypass (admin プレビュー)
//   2. LINE 未開封 → PremiumClient に委譲し、client 側で LineGateOverlay 表示
//      (LINE 登録は何より先に取りたいリード獲得チャネルなので最優先)
//   3. X OAuth が未設定 → ガード OFF (開発フォールバック)
//   4. X 未認証 → XAuthRequired を表示
//   5. 別人ログイン → OwnershipMismatch を表示 (アカウント切替誘導)
//   6. 全て通過 → PremiumClient (詳細レポート)
// ============================================================

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogIn, AlertCircle, LogOut, ArrowRight } from "lucide-react";
import { PremiumClient } from "./client";
import { isXOauthConfigured } from "@/lib/x-oauth";
import { LINE_VERIFIED_COOKIE, LINE_VERIFIED_COOKIE_LEGACY, LINE_VERIFIED_VALUE } from "@/lib/line";

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

  // ?mock=1 は admin の UI プレビュー用。全ガードをスキップして
  // モックデータでそのまま表示する。
  if (sp.mock === "1") {
    return <PremiumClient username={username} />;
  }

  const cookieStore = await cookies();
  const headersList = await headers();

  // LINE 内ブラウザ判定: ボット URL からタップして開いた = すでに LINE 友だち
  // 確定なので、LINE ゲートを無条件にスキップする。
  const ua = headersList.get("user-agent") ?? "";
  const isLineInAppBrowser = /\bLine\//i.test(ua);

  // ----- 1) LINE ゲート (最優先) -----
  // LINE 開封 cookie が無い場合は client に渡す。PremiumClient 内で
  // localStorage / cookie の両方をチェックして LineGateOverlay を出す。
  const lineOpened =
    isLineInAppBrowser ||
    cookieStore.get(LINE_VERIFIED_COOKIE)?.value === LINE_VERIFIED_VALUE ||
    cookieStore.get(LINE_VERIFIED_COOKIE_LEGACY)?.value === LINE_VERIFIED_VALUE;
  if (!lineOpened) {
    return <PremiumClient username={username} />;
  }

  // ----- 2) X OAuth ゲート (LINE 通過後) -----
  // X OAuth が未設定なら、ガード OFF（開発時のフォールバック）
  if (!isXOauthConfigured()) {
    return <PremiumClient username={username} initialLineVerified />;
  }

  const xHandle = cookieStore.get("kaiji_x_handle")?.value;

  // 未ログイン → X 認証 UI
  if (!xHandle) {
    return <XAuthRequired username={username} />;
  }

  // 所有者不一致
  if (xHandle.toLowerCase() !== username.toLowerCase()) {
    return <OwnershipMismatch authedAs={xHandle} target={username} />;
  }

  // 認証済 + 一致 → 通常表示
  return <PremiumClient username={username} initialLineVerified />;
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
//
// 動線設計の前提:
//   ブラウザ (Safari 等) に @authedAs の X セッションが残っている状態。
//   そのまま OAuth に飛ばしても X が同じセッションで自動承認するため、
//   何度押しても同じハンドルが返ってきてループする。
//   → 「Safari の X から一度ログアウト → 本人で再ログイン → 戻って再連携」
//      という 2 ステップを明示的に提示する。
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

        <p className="mt-4 text-left text-[13px] leading-relaxed text-text-sub">
          ブラウザに <strong className="font-mono text-foreground">@{authedAs}</strong> のログインが残っているため、
          そのまま再連携しても同じアカウントが返ってきます。
          <br />
          下の手順で <strong className="font-mono text-foreground">@{target}</strong> に切り替えてください。
        </p>

        {/* ----- 2 step flow ----- */}
        <ol className="mt-5 space-y-3 text-left">
          {/* Step 1 */}
          <li className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-extrabold text-white">1</span>
              <span className="text-[13px] font-bold text-foreground">
                X で <span className="font-mono">@{target}</span> に切り替え
              </span>
            </div>
            <p className="mt-1 pl-8 text-[11px] leading-relaxed text-text-muted">
              新しいタブで X のログイン画面が開きます。<strong className="text-foreground"><span className="font-mono">@{target}</span> でログイン</strong>してください（既存セッションがある場合は一度サインアウトしてから再ログイン）。
            </p>
            <a
              href="https://x.com/i/flow/login"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 ml-8 inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-[12px] font-bold text-foreground hover:bg-slate-50 active:scale-[0.97]"
            >
              <LogOut className="h-3.5 w-3.5" />
              X のログイン画面を開く
            </a>
          </li>

          {/* Step 2 */}
          <li className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-extrabold text-white">2</span>
              <span className="text-[13px] font-bold text-foreground">
                ここに戻って下のボタンをタップ
              </span>
            </div>
            <p className="mt-1 pl-8 text-[11px] leading-relaxed text-text-muted">
              <span className="font-mono">@{target}</span> でログインできたら、このタブに戻って下のボタンを押してください。
            </p>
          </li>
        </ol>

        <a
          href={`/api/auth/x/start?return=${encodeURIComponent(returnTo)}`}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 text-base font-extrabold text-white shadow-lg shadow-slate-900/30 hover:opacity-90 active:scale-[0.97]"
        >
          <span className="text-lg leading-none">𝕏</span>
          <span className="font-mono">@{target}</span> で続ける
          <ArrowRight className="h-4 w-4" />
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
