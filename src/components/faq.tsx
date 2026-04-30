"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "匿名アカウントの相手を本当に特定できますか？",
    a: "2024年の改正プロバイダ責任制限法で発信者情報開示請求が 1 回の裁判手続きで可能になりました。誹謗中傷が法律に抵触する場合、匿名でも発信者の特定は法的に可能です。ただし最終的な判断は弁護士にご相談ください。",
  },
  {
    q: "判定はどれくらい正確？",
    a: "本サービスは法的判断ではなく、公開投稿を独自の解析エンジンで整理・分類するツールです。「名誉毀損の可能性がある表現が含まれています」という形で情報を整理し、最終判断は必ず弁護士にお任せいただきます。",
  },
  {
    q: "どんな情報が分析対象ですか？",
    a: "X（旧Twitter）の公開されている投稿のみを分析します。非公開（鍵アカウント）の投稿や DM は分析対象外です。X API v2 経由で取得できる最新 100 件程度の投稿が対象となります。",
  },
  {
    q: "弁護士法に違反していませんか？",
    a: "本サービスは法的助言を提供せず、公開情報の整理・分類のみを行うツールです。法的判断・代理行為は一切行いません。実際の対応については、ご自身でお近くの法律事務所等の専門家にご相談ください。",
  },
  {
    q: "無料でどこまで使えますか？",
    a: "全機能を無料でご利用いただけます。問題投稿の件数・開示請求レベル・上位3件の表示までは登録なしで即時に確認できます。全件表示・開示請求書テンプレート等の詳細レポートは、公式 LINE に登録すると開放されます（課金は一切ありません）。",
  },
  {
    q: "本当に完全無料ですか？",
    a: "はい。本サービスからユーザー様に月額課金等を請求することは一切ありません。",
  },
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-16 sm:py-20">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-gradient-blue">
            FAQ
          </span>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            よくある質問
          </h2>
        </div>

        <div className="mt-10 space-y-2">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className={`rounded-xl border transition-all ${
                  isOpen ? "border-primary/20 bg-primary-bg" : "border-border bg-white"
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between px-4 py-3 sm:px-5 sm:py-4 text-left"
                >
                  <span className="pr-4 text-sm font-semibold">{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4">
                    <p className="text-sm leading-relaxed text-text-sub">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
