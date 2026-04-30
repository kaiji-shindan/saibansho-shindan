"use client";

// ============================================================
// AccountAnalysisCard
//
// X API で取得した実ツイート配列から算出した客観指標のみを描画。
// 定性分類 (発信トーン / サブジャンル / エンゲージメント安定度 等) は
// Claude への追加呼び出しが必要かつ主観的なので削除済み。
// ============================================================

import type { AnalysisData } from "@/lib/diagnose-types";

// BCP-47 → 日本語ラベル
const LANG_LABELS: Record<string, string> = {
  ja: "日本語",
  en: "英語",
  ko: "韓国語",
  zh: "中国語",
  th: "タイ語",
  und: "判定不可",
  unknown: "不明",
};

function langLabel(code: string): string {
  return LANG_LABELS[code] ?? code;
}

// ============================================================
// Composition bar — 合計 100% に正規化した横方向スタック
// ============================================================
function CompositionBar({
  items,
}: {
  items: { label: string; value: number; color: string }[];
}) {
  const total = items.reduce((a, b) => a + b.value, 0);
  if (total === 0) return null;
  return (
    <div>
      <div className="flex h-6 overflow-hidden rounded-lg">
        {items.map((item) => {
          const pct = (item.value / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={item.label}
              className="flex items-center justify-center text-[9px] font-bold text-white transition-all"
              style={{ width: `${pct}%`, backgroundColor: item.color }}
            >
              {pct > 12 && `${pct.toFixed(0)}%`}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {items.map((item) => {
          const pct = (item.value / total) * 100;
          return (
            <span
              key={item.label}
              className="flex items-center gap-1.5 text-[11px] text-text-sub"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.label} {item.value}件 ({pct.toFixed(0)}%)
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// 24時間分布の横棒
// ============================================================
function HourlyBars({ hourly, peakHour }: { hourly: number[]; peakHour: number }) {
  const max = Math.max(1, ...hourly);

  // 6 時間ずつ 4 バケット
  const buckets = [
    { label: "深夜 0-5時", range: [0, 6], color: "#1e293b" },
    { label: "朝 6-11時", range: [6, 12], color: "#f59e0b" },
    { label: "昼 12-17時", range: [12, 18], color: "#3b82f6" },
    { label: "夜 18-23時", range: [18, 24], color: "#6366f1" },
  ].map((b) => ({
    ...b,
    count: hourly.slice(b.range[0], b.range[1]).reduce((a, c) => a + c, 0),
  }));
  const maxBucket = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold text-text-sub">投稿時間帯 (JST)</span>
        <span className="text-xs text-text-muted">
          ピーク: <span className="font-bold text-foreground">{peakHour}時台</span>
        </span>
      </div>
      <div className="space-y-2.5">
        {buckets.map((b) => (
          <div key={b.label} className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-[10px] sm:w-24 sm:text-[11px] font-medium text-text-sub">
              {b.label}
            </span>
            <div className="flex-1">
              <div className="h-4 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="animate-fill-bar h-full rounded-full"
                  style={{
                    width: `${(b.count / maxBucket) * 100}%`,
                    backgroundColor: b.color,
                  }}
                />
              </div>
            </div>
            <span className="w-10 text-right text-[11px] font-bold text-text-sub">
              {b.count}件
            </span>
          </div>
        ))}
      </div>
      {/* 24時間の全分布 (小さい stacked bar) */}
      <div className="mt-4">
        <p className="text-[10px] text-text-muted">24時間帯の分布</p>
        <div className="mt-1 flex items-end gap-px h-10">
          {hourly.map((count, h) => (
            <div
              key={h}
              className="flex-1 rounded-sm"
              style={{
                height: `${(count / max) * 100}%`,
                backgroundColor: h === peakHour ? "#6366f1" : "#cbd5e1",
                minHeight: count > 0 ? 2 : 0,
              }}
              title={`${h}時: ${count}件`}
            />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[9px] text-text-muted">
          <span>0</span>
          <span>6</span>
          <span>12</span>
          <span>18</span>
          <span>23</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main
// ============================================================
export function AccountAnalysisCard({ analysis }: { analysis: AnalysisData }) {
  if (analysis.analyzedPosts === 0) {
    return (
      <div className="rounded-2xl border border-border bg-white p-5 text-center text-sm text-text-muted">
        分析対象の投稿がありません
      </div>
    );
  }

  const compositionItems = [
    { label: "オリジナル", value: analysis.composition.original, color: "#3b82f6" },
    { label: "リプライ", value: analysis.composition.reply, color: "#8b5cf6" },
    { label: "引用", value: analysis.composition.quoted, color: "#f59e0b" },
  ];

  const mediaItems = [
    { label: "テキストのみ", value: analysis.media.textOnly, color: "#6366f1" },
    { label: "メディア付き", value: analysis.media.withMedia, color: "#ef4444" },
    { label: "リンク付き", value: analysis.media.withLink, color: "#a855f7" },
  ];

  return (
    <div className="rounded-2xl border border-border bg-white p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">投稿パターン分析</h3>
        <span className="text-[11px] text-text-muted">
          {analysis.analyzedPosts}件 / 約{analysis.analyzedDays}日間
        </span>
      </div>

      {/* Tweet composition */}
      <div className="mt-5">
        <p className="mb-2.5 text-xs font-semibold text-text-sub">
          投稿構成
          <span className="ml-1 text-[10px] text-text-muted">
            (※ リツイートは分析対象外)
          </span>
        </p>
        <CompositionBar items={compositionItems} />
      </div>

      {/* Media composition */}
      <div className="mt-5">
        <p className="mb-2.5 text-xs font-semibold text-text-sub">メディア構成</p>
        <CompositionBar items={mediaItems} />
      </div>

      {/* Divider */}
      <div className="my-5 h-px bg-border" />

      {/* Frequency + Language */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-[11px] font-medium text-text-muted">投稿頻度</p>
          <p className="mt-1 text-xl font-extrabold">
            {analysis.postsPerDay}
            <span className="ml-0.5 text-xs font-medium text-text-muted">件/日</span>
          </p>
          <p className="mt-0.5 text-[10px] text-text-muted">
            期間: 約{analysis.analyzedDays}日分
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-[11px] font-medium text-text-muted">主な使用言語</p>
          <p className="mt-1 text-xl font-extrabold">{langLabel(analysis.topLanguage)}</p>
          {analysis.languages.length > 1 && (
            <p className="mt-0.5 text-[10px] text-text-muted">
              他 {analysis.languages.length - 1} 言語
            </p>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="my-5 h-px bg-border" />

      {/* Posting hours */}
      <HourlyBars hourly={analysis.hourlyCounts} peakHour={analysis.peakHour} />
    </div>
  );
}
