"use client";

// ============================================================
// AccountProfileCard
//
// X API /2/users/:username の公開フィールドのみを描画する。
// 取得できないデータ (フォロワー増減 / 追跡開始日 / アカウントタイプ) は
// 表示しない。認証バッジは verified_type が "none" 以外の時だけ表示。
// ============================================================

import { useState } from "react";
import Image from "next/image";
import { CheckCircle, ExternalLink, Lock, Pin, User } from "lucide-react";
import type { ProfileData } from "@/lib/diagnose-types";

// ============================================================
// Avatar
// ============================================================
function ProfileAvatar({
  username,
  src,
  size = 64,
}: {
  username: string;
  src?: string;
  size?: number;
}) {
  const [err, setErr] = useState(false);
  // X が返す profile_image_url は `_normal` (48px) が付くので、大きめを要求
  const normalizedSrc =
    src?.replace(/_normal(\.[a-z]+)$/i, "$1") ??
    `https://unavatar.io/x/${username}`;

  if (err) {
    return (
      <div
        className="flex items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100"
        style={{ width: size, height: size }}
      >
        <User className="text-blue-400" style={{ width: size * 0.45, height: size * 0.45 }} />
      </div>
    );
  }
  return (
    <Image
      src={normalizedSrc}
      alt={`@${username}`}
      width={size}
      height={size}
      className="rounded-full object-cover ring-2 ring-white shadow-lg"
      onError={() => setErr(true)}
      unoptimized
    />
  );
}

// ============================================================
// Stat cell
// ============================================================
function StatCell({
  value,
  label,
  color = "text-blue-600",
}: {
  value: number;
  label: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-3.5">
      <p className={`text-xl font-extrabold leading-tight ${color}`}>
        {value.toLocaleString("ja-JP")}
      </p>
      <p className="mt-0.5 text-[11px] font-medium text-text-muted">{label}</p>
    </div>
  );
}

// ============================================================
// Verification badge — verified_type に応じて色分け
// ============================================================
function VerifiedBadge({ type }: { type: ProfileData["verifiedType"] }) {
  if (type === "none") return null;
  const config = {
    blue: { label: "Blue認証", bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-600" },
    business: { label: "ビジネス認証", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
    government: { label: "政府認証", bg: "bg-slate-100", border: "border-slate-300", text: "text-slate-700" },
  }[type];
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${config.bg} ${config.border} ${config.text}`}>
      {config.label}
    </span>
  );
}

// ============================================================
// Component
// ============================================================
export function AccountProfileCard({
  profile,
  showPinned = false,
}: {
  profile: ProfileData;
  /** When true, render the pinned tweet card (premium only). */
  showPinned?: boolean;
}) {
  const bioUrls = profile.bioEntities?.urls ?? [];
  const bioHashtags = profile.bioEntities?.hashtags ?? [];
  return (
    <>
      {/* Profile card */}
      <div className="rounded-2xl border border-border bg-white p-4 sm:p-5">
        <div className="flex gap-4">
          <ProfileAvatar
            username={profile.username}
            src={profile.profileImageUrl}
            size={64}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-base font-extrabold">{profile.displayName}</p>
              {profile.isVerified && (
                <CheckCircle className="h-4 w-4 shrink-0 text-blue-500" />
              )}
              {profile.isProtected && (
                <Lock className="h-4 w-4 shrink-0 text-amber-500" aria-label="鍵アカ" />
              )}
            </div>
            <p className="text-sm text-text-muted">@{profile.username}</p>
            {profile.bio && (
              <p className="mt-2 text-xs leading-relaxed text-text-sub whitespace-pre-wrap">
                {profile.bio}
              </p>
            )}
            {profile.url && (
              <a
                href={profile.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs text-blue-500 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                {profile.url.replace(/^https?:\/\//, "")}
              </a>
            )}
            {(bioUrls.length > 0 || bioHashtags.length > 0) && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {bioUrls.slice(0, 3).map((u) => (
                  <a
                    key={u.url}
                    href={u.expandedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex max-w-[200px] items-center gap-1 truncate rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 hover:underline"
                    title={u.expandedUrl}
                  >
                    <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                    {u.displayUrl}
                  </a>
                ))}
                {bioHashtags.slice(0, 4).map((h) => (
                  <span
                    key={h}
                    className="rounded-full border border-violet-100 bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700"
                  >
                    #{h}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          <VerifiedBadge type={profile.verifiedType} />
          {profile.isProtected && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
              <Lock className="h-2.5 w-2.5" />
              鍵アカ
            </span>
          )}
          <span className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-[10px] font-semibold text-text-sub">
            作成日 {profile.accountCreated}
          </span>
        </div>
      </div>

      {/* Stats grid — X API public_metrics の全 4 フィールド */}
      <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2">
        <StatCell value={profile.followers} label="フォロワー" color="text-blue-600" />
        <StatCell value={profile.following} label="フォロー中" color="text-slate-700" />
        <StatCell value={profile.totalTweets} label="総投稿数" color="text-indigo-600" />
        <StatCell value={profile.listed} label="リスト" color="text-cyan-600" />
      </div>

      {showPinned && profile.pinnedTweet && (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/70 to-white p-4 sm:p-5">
          <p className="flex items-center gap-1.5 text-[11px] font-extrabold text-amber-700">
            <Pin className="h-3 w-3" />
            プロフィールに固定中の投稿
          </p>
          <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-text-main">
            {profile.pinnedTweet.text}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-text-muted">
            <span>{new Date(profile.pinnedTweet.createdAt).toLocaleString("ja-JP")}</span>
            <span>♥ {profile.pinnedTweet.likes}</span>
            <span>↻ {profile.pinnedTweet.rt}</span>
            <span>↩ {profile.pinnedTweet.reply}</span>
            {profile.pinnedTweet.quote > 0 && <span>❝ {profile.pinnedTweet.quote}</span>}
            {profile.pinnedTweet.isLongForm && (
              <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[9px] font-extrabold text-indigo-700">
                LONG
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
}
