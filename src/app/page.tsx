"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Loader2, Scale, Shield, Zap } from "lucide-react";
import { parseUsername } from "@/lib/parse-username";

export default function Home() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = parseUsername(username);
    if (!cleaned) return;
    setLoading(true);
    router.push(`/diagnose/${cleaned}`);
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* ===== Background ===== */}
      <div className="pointer-events-none fixed inset-0">
        <div className="bg-mesh-blue absolute inset-0" />
        <div className="bg-grid-subtle absolute inset-0" />
        <div className="animate-float-slow absolute top-[8%] left-[5%] h-[250px] w-[250px] sm:h-[420px] sm:w-[420px] rounded-full bg-gradient-to-br from-blue-500/[0.07] via-indigo-400/[0.05] to-transparent blur-[60px] sm:blur-[80px]" />
        <div className="animate-float-reverse absolute top-[15%] right-[5%] h-[200px] w-[200px] sm:h-[350px] sm:w-[350px] rounded-full bg-gradient-to-bl from-violet-500/[0.06] via-blue-400/[0.04] to-transparent blur-[60px] sm:blur-[80px]" />
        <div className="animate-float-slow absolute bottom-[5%] left-[30%] h-[180px] w-[180px] sm:h-[280px] sm:w-[280px] rounded-full bg-gradient-to-tr from-cyan-400/[0.05] via-blue-300/[0.03] to-transparent blur-[50px] sm:blur-[70px] [animation-delay:4s]" />
      </div>

      {/* ===== Header ===== */}
      <header className="safe-pt animate-fade-in relative z-10 flex items-center justify-between px-5 pt-4 pb-3 sm:px-8 sm:pt-6 sm:pb-5" style={{ animationDelay: "0.1s", opacity: 0 }}>
        <div className="flex items-center gap-2.5">
          <Image src="/logo_icon.png" alt="ロゴ" width={32} height={32} className="h-7 w-7 sm:h-8 sm:w-8" />
          <span className="text-[15px] font-extrabold tracking-tight sm:text-base">
            開示請求<span className="text-gradient-blue">診断</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/me"
            className="inline-flex h-9 items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 text-[11px] font-bold text-rose-700 backdrop-blur-sm transition-all active:scale-[0.96] sm:h-10 sm:px-3.5 sm:text-xs"
          >
            <Shield className="h-3 w-3" />
            被害者モード
          </a>
          <a
            href="/about"
            className="inline-flex h-9 items-center rounded-full border border-border/80 bg-white/70 px-3.5 text-[12px] font-semibold text-text-sub backdrop-blur-sm transition-all active:scale-[0.96] sm:h-10 sm:px-4 sm:text-xs"
          >
            サービスについて
          </a>
        </div>
      </header>

      {/* ===== Main ===== */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 pt-2 pb-10 sm:px-6 sm:pb-24">
        <div className="w-full max-w-lg text-center">
          {/* Icon */}
          <div
            className="animate-scale-in mx-auto mb-5 flex justify-center sm:mb-6"
            style={{ animationDelay: "0.15s", opacity: 0 }}
          >
            <Image src="/logo_icon.png" alt="開示請求診断" width={72} height={72} className="animate-icon-pulse h-[68px] w-[68px] drop-shadow-[0_8px_24px_rgba(99,102,241,0.18)] sm:h-[80px] sm:w-[80px]" />
          </div>

          {/* Title */}
          <h1
            className="animate-slide-up text-[30px] font-extrabold leading-[1.15] tracking-tight sm:text-[2.5rem]"
            style={{ animationDelay: "0.25s", opacity: 0 }}
          >
            開示請求診断
          </h1>

          {/* Subtitle */}
          <p
            className="animate-slide-up mx-auto mt-3 max-w-[20rem] text-[14px] leading-relaxed text-text-sub sm:mt-3 sm:max-w-none sm:text-lg"
            style={{ animationDelay: "0.35s", opacity: 0 }}
          >
            Xアカウントの誹謗中傷を<strong className="text-foreground">独自エンジンで分析</strong>
          </p>

          {/* ===== Input form ===== */}
          <form
            onSubmit={handleSubmit}
            className="animate-slide-up mt-7 sm:mt-10"
            style={{ animationDelay: "0.45s", opacity: 0 }}
          >
            <div className="flex items-center rounded-2xl border border-border bg-white/90 p-2 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)] backdrop-blur-md transition-all focus-within:border-blue-400/60 focus-within:shadow-[0_12px_40px_-12px_rgba(59,130,246,0.25)] sm:p-2">
              <span className="pl-3 text-lg font-bold text-text-muted/60 sm:pl-4 sm:text-xl">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ユーザー名 / URL"
                className="flex-1 min-w-0 bg-transparent px-2 py-3 text-[16px] outline-none placeholder:text-text-muted/40 sm:py-3 sm:text-lg"
                disabled={loading}
                autoFocus
              />
              <button
                type="submit"
                disabled={loading || !username.replace(/^@/, "").trim()}
                className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 text-[13px] font-bold text-white shadow-[0_8px_20px_-6px_rgba(124,58,237,0.5)] transition-all active:scale-[0.96] disabled:opacity-30 disabled:shadow-none sm:h-12 sm:gap-2 sm:px-7 sm:text-sm"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    実行
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Description */}
          <p
            className="animate-fade-in mt-3.5 text-[12px] text-text-muted sm:mt-5 sm:text-sm"
            style={{ animationDelay: "0.6s", opacity: 0 }}
          >
            レベル（S〜E）、スコア（0-100）を即座に診断
          </p>

          {/* ===== Feature pills ===== */}
          <div
            className="animate-fade-in mt-5 flex flex-wrap items-center justify-center gap-2 sm:mt-8"
            style={{ animationDelay: "0.7s", opacity: 0 }}
          >
            {[
              { icon: Zap, label: "無料", color: "text-amber-600 bg-amber-50 border-amber-200/60" },
              { icon: Shield, label: "弁護士監修", color: "text-blue-600 bg-blue-50 border-blue-200/60" },
              { icon: Scale, label: "X API連携", color: "text-emerald-600 bg-emerald-50 border-emerald-200/60" },
            ].map((pill) => (
              <span
                key={pill.label}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold sm:px-3.5 sm:text-xs ${pill.color}`}
              >
                <pill.icon className="h-3 w-3" />
                {pill.label}
              </span>
            ))}
          </div>

          {/* ===== Disclosure request benefits ===== */}
          <div
            className="animate-fade-in mt-12 sm:mt-14"
            style={{ animationDelay: "1.0s", opacity: 0 }}
          >
            <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-gradient-blue sm:text-xs">
              匿名の誹謗中傷は、もう逃げられない
            </p>
            <p className="mt-2 text-center text-[13px] font-medium text-text-sub sm:text-sm">
              開示請求であなたができること
            </p>

            {/* Compact 3-col grid on mobile, larger on desktop */}
            <div className="mt-5 grid grid-cols-3 gap-2.5 sm:mt-6 sm:gap-3">
              {[
                { emoji: "👤", title: "身元を特定", desc: "氏名・住所が判明" },
                { emoji: "💰", title: "慰謝料請求", desc: "30〜100万円" },
                { emoji: "⚖️", title: "刑事責任", desc: "侮辱罪の対象" },
              ].map((item) => (
                <div
                  key={item.title}
                  className="group flex flex-col items-center rounded-2xl border border-border/70 bg-white/70 px-2 py-3.5 text-center shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] backdrop-blur-sm transition-all active:scale-[0.97] sm:px-3 sm:py-4"
                >
                  <span className="text-2xl leading-none sm:text-2xl" aria-hidden>{item.emoji}</span>
                  <p className="mt-2 text-[12px] font-bold leading-tight sm:text-[13px]">{item.title}</p>
                  <p className="mt-1 text-[10px] leading-tight text-text-muted sm:text-[11px]">{item.desc}</p>
                </div>
              ))}
            </div>

            <p className="mx-auto mt-4 max-w-[22rem] text-center text-[10.5px] leading-relaxed text-text-muted sm:mt-4 sm:text-[11px]">
              2022年の侮辱罪厳罰化・2024年の開示請求簡略化により、誹謗中傷の法的対処がかつてないほど容易になっています。
            </p>
          </div>

          {/* ===== Level meter preview ===== */}
          <div
            className="animate-fade-in mx-auto mt-8 w-full max-w-[20rem] sm:mt-12 sm:max-w-sm"
            style={{ animationDelay: "1.1s", opacity: 0 }}
          >
            <div className="rounded-2xl border border-border/70 bg-white/70 px-4 py-3.5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] backdrop-blur-sm sm:px-5 sm:py-4">
              <div className="flex items-center justify-between text-[11px] font-semibold text-text-sub sm:text-[11px]">
                <span>開示請求レベル</span>
                <span className="flex items-center gap-1">
                  <span className="text-emerald-500">E</span>
                  <span className="mx-1 inline-block h-px w-3 bg-text-muted/30" />
                  <span className="text-rose-500">S</span>
                </span>
              </div>
              <div className="mt-2.5 flex items-end gap-1">
                {["E", "D", "C", "B", "A", "S"].map((lv, i) => (
                  <div key={lv} className="flex flex-1 flex-col items-center gap-1.5">
                    <div
                      className="h-2 w-full rounded-full"
                      style={{
                        background: ["#22c55e", "#84cc16", "#eab308", "#f97316", "#ef4444", "#dc2626"][i],
                        opacity: 0.75 + i * 0.05,
                      }}
                    />
                    <span className="text-[10px] font-bold text-text-muted/80">{lv}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ===== Footer ===== */}
      <footer className="safe-pb animate-fade-in relative z-10 px-5 pt-4 pb-5 text-center sm:px-6 sm:pb-5" style={{ animationDelay: "1.2s", opacity: 0 }}>
        <p className="mx-auto max-w-[24rem] text-[11px] leading-relaxed text-text-muted sm:text-[11px]">
          本サービスは法的助言を提供するものではありません。
          <a href="/about" className="ml-1 font-medium underline decoration-text-muted/40 underline-offset-2 hover:text-text-sub">
            詳しく見る
          </a>
        </p>
      </footer>
    </div>
  );
}
