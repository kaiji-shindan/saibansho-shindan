import { Fragment } from "react";
import { Search, Brain, FileText, UserCheck, ChevronRight } from "lucide-react";

const steps = [
  {
    num: "1",
    icon: Search,
    title: "アカウントを入力",
    description: "@ユーザー名を入力するだけ",
    color: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-100",
    ring: "ring-blue-100",
  },
  {
    num: "2",
    icon: Brain,
    title: "独自エンジンで分析",
    description: "投稿・リプライを一括で分析",
    color: "text-violet-500",
    bg: "bg-violet-50",
    border: "border-violet-100",
    ring: "ring-violet-100",
  },
  {
    num: "3",
    icon: FileText,
    title: "レベル判定",
    description: "開示請求レベルをS〜Eで判定",
    color: "text-indigo-500",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
    ring: "ring-indigo-100",
  },
  {
    num: "4",
    icon: UserCheck,
    title: "証拠レポート出力",
    description: "詳細レポートをPDFで保存",
    color: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-100",
    ring: "ring-blue-100",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-16 sm:py-20 bg-surface">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-gradient-blue">
            How it works
          </span>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            使い方はカンタン
          </h2>
          <p className="mt-2 text-sm text-text-sub">
            たった4ステップで診断完了。登録不要ですぐ使えます。
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] lg:gap-0">
          {steps.map((step, i) => (
            <Fragment key={step.num}>
              {/* Card */}
              <div
                className={`card-hover flex min-h-[130px] sm:min-h-[170px] flex-col items-center justify-center rounded-2xl border ${step.border} bg-white p-4 sm:p-5 text-center`}
              >
                {/* Icon + number */}
                <div className="relative">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${step.bg} ring-4 ${step.ring}`}>
                    <step.icon className={`h-5 w-5 ${step.color}`} />
                  </div>
                  <span className={`absolute -top-1.5 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-indigo-400 text-[10px] font-bold text-white shadow-sm`}>
                    {step.num}
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-bold">{step.title}</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-text-muted">{step.description}</p>
              </div>

              {/* Arrow connector (desktop only) */}
              {i < steps.length - 1 && (
                <div key={`arrow-${i}`} className="hidden items-center justify-center px-2 lg:flex">
                  <ChevronRight className="h-4 w-4 text-indigo-300/50" />
                </div>
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
