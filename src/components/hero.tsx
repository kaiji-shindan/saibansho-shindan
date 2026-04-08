"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { parseUsername } from "@/lib/parse-username";

export function Hero() {
  const [username, setUsername] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = parseUsername(username);
    if (cleaned) {
      router.push(`/diagnose/${cleaned}`);
    }
  };

  return (
    <section className="relative overflow-hidden pt-20 pb-16 sm:pt-28 sm:pb-20">
      {/* ===== Multi-layer background ===== */}

      {/* Base: radial gradient for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 120% 80% at 50% 0%, #1e1b4b 0%, #10102a 40%, #0c0c20 70%, #080816 100%)",
        }}
      />

      {/* Diagonal light streak for depth */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: "linear-gradient(135deg, transparent 30%, rgba(99,102,241,0.04) 45%, rgba(139,92,246,0.06) 50%, rgba(99,102,241,0.04) 55%, transparent 70%)",
        }}
      />

      {/* Animated orbs */}
      <div className="pointer-events-none absolute inset-0">
        {/* XL orbs — background atmosphere */}
        <div className="animate-float-slow absolute -top-[5%] -left-[5%] h-[260px] w-[260px] sm:h-[500px] sm:w-[500px] rounded-full bg-violet-600/[0.14] blur-[80px] sm:blur-[120px]" />
        <div className="animate-float-reverse absolute -top-[8%] right-[0%] h-[240px] w-[240px] sm:h-[450px] sm:w-[450px] rounded-full bg-indigo-500/[0.12] blur-[80px] sm:blur-[110px]" />
        <div className="animate-float-slow absolute bottom-[0%] right-[10%] h-[220px] w-[220px] sm:h-[400px] sm:w-[400px] rounded-full bg-blue-600/[0.1] blur-[70px] sm:blur-[100px] [animation-delay:3s]" />
        <div className="animate-float-reverse absolute bottom-[-5%] left-[5%] h-[230px] w-[230px] sm:h-[420px] sm:w-[420px] rounded-full bg-purple-600/[0.08] blur-[80px] sm:blur-[110px] [animation-delay:5s]" />

        {/* Large orbs — mid layer */}
        <div className="animate-float-reverse absolute top-[15%] left-[25%] h-[320px] w-[320px] rounded-full bg-fuchsia-500/[0.08] blur-[90px] [animation-delay:1s]" />
        <div className="animate-float-slow absolute top-[10%] right-[20%] h-[300px] w-[300px] rounded-full bg-violet-400/[0.1] blur-[85px] [animation-delay:2s]" />
        <div className="animate-float-reverse absolute top-[40%] left-[50%] h-[280px] w-[280px] rounded-full bg-cyan-500/[0.06] blur-[80px] [animation-delay:4s]" />
        <div className="animate-float-slow absolute top-[35%] left-[10%] h-[260px] w-[260px] rounded-full bg-indigo-400/[0.07] blur-[85px] [animation-delay:6s]" />

        {/* Medium orbs — detail layer */}
        <div className="animate-float-slow absolute top-[5%] left-[50%] h-[220px] w-[220px] rounded-full bg-blue-400/[0.08] blur-[70px] [animation-delay:1.5s]" />
        <div className="animate-float-reverse absolute top-[25%] right-[8%] h-[200px] w-[200px] rounded-full bg-purple-500/[0.09] blur-[65px] [animation-delay:3.5s]" />
        <div className="animate-float-slow absolute bottom-[20%] left-[35%] h-[240px] w-[240px] rounded-full bg-violet-500/[0.07] blur-[75px] [animation-delay:7s]" />
        <div className="animate-float-reverse absolute bottom-[15%] right-[35%] h-[200px] w-[200px] rounded-full bg-indigo-300/[0.06] blur-[60px] [animation-delay:2.5s]" />
        <div className="animate-float-slow absolute top-[55%] right-[15%] h-[180px] w-[180px] rounded-full bg-fuchsia-400/[0.05] blur-[60px] [animation-delay:8s]" />

        {/* Small orbs — sparkle layer */}
        <div className="animate-float-reverse absolute top-[18%] left-[15%] h-[140px] w-[140px] rounded-full bg-cyan-400/[0.07] blur-[50px] [animation-delay:0.5s]" />
        <div className="animate-float-slow absolute top-[8%] left-[75%] h-[120px] w-[120px] rounded-full bg-violet-300/[0.08] blur-[45px] [animation-delay:4.5s]" />
        <div className="animate-float-reverse absolute bottom-[8%] left-[60%] h-[150px] w-[150px] rounded-full bg-blue-300/[0.06] blur-[50px] [animation-delay:6.5s]" />
        <div className="animate-float-slow absolute top-[45%] left-[70%] h-[130px] w-[130px] rounded-full bg-purple-300/[0.07] blur-[45px] [animation-delay:5.5s]" />
        <div className="animate-float-reverse absolute bottom-[30%] left-[15%] h-[110px] w-[110px] rounded-full bg-indigo-300/[0.08] blur-[40px] [animation-delay:3s]" />
        <div className="animate-float-slow absolute top-[65%] left-[45%] h-[100px] w-[100px] rounded-full bg-violet-400/[0.06] blur-[35px] [animation-delay:7.5s]" />
      </div>

      {/* Animated floating particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[
          { x: "12%", y: "20%", size: 3, delay: "0s", dur: "8s" },
          { x: "75%", y: "15%", size: 2, delay: "1s", dur: "10s" },
          { x: "30%", y: "70%", size: 2, delay: "3s", dur: "9s" },
          { x: "85%", y: "60%", size: 3, delay: "2s", dur: "11s" },
          { x: "50%", y: "30%", size: 2, delay: "4s", dur: "7s" },
          { x: "20%", y: "50%", size: 1.5, delay: "5s", dur: "12s" },
          { x: "65%", y: "80%", size: 2, delay: "1.5s", dur: "9s" },
          { x: "90%", y: "35%", size: 1.5, delay: "3.5s", dur: "10s" },
        ].map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-violet-300/20"
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              animation: `float-slow ${p.dur} ease-in-out infinite`,
              animationDelay: p.delay,
            }}
          />
        ))}
      </div>

      {/* Grid lines (subtle) */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* ===== Content ===== */}
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        {/* Title */}
        <h1
          className="animate-slide-up text-4xl font-extrabold leading-[1.15] tracking-tight text-white sm:text-5xl lg:text-6xl"
          style={{ animationDelay: "0.1s", opacity: 0 }}
        >
          <span className="inline-block">その誹謗中傷、</span>
          <span className="inline-block">
            <span className="bg-gradient-to-r from-violet-300 via-indigo-300 to-blue-300 bg-clip-text text-transparent">開示請求</span>かも？
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className="animate-slide-up mx-auto mt-4 max-w-lg text-base leading-relaxed text-slate-400 sm:text-lg"
          style={{ animationDelay: "0.2s", opacity: 0 }}
        >
          気になるXアカウントを入力するだけ。
          <br className="hidden sm:block" />
          独自エンジンが投稿を分析して<strong className="text-white">開示請求レベル</strong>を判定します。
        </p>

        {/* Search label */}
        <p
          className="animate-fade-in mt-8 text-xs font-medium tracking-wide text-slate-500"
          style={{ animationDelay: "0.3s", opacity: 0 }}
        >
          アカウント検索
        </p>

        {/* Input form */}
        <form
          onSubmit={handleSubmit}
          className="animate-slide-up mx-auto mt-2.5 max-w-lg"
          style={{ animationDelay: "0.35s", opacity: 0 }}
        >
          <div className="flex items-center rounded-2xl border border-white/[0.08] bg-white/[0.04] p-2 shadow-2xl shadow-black/20 backdrop-blur-sm transition-all focus-within:border-violet-400/40 focus-within:bg-white/[0.07]">
            <span className="pl-4 text-xl font-bold text-slate-500">@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ユーザー名 または URL を入力"
              className="flex-1 bg-transparent px-2 py-3 text-lg text-white outline-none placeholder:text-slate-500"
            />
            <button
              type="submit"
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-400 to-indigo-400 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-indigo-500 hover:shadow-xl hover:shadow-violet-500/30 active:scale-[0.97]"
            >
              診断
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </form>

        {/* Social proof */}
        <div
          className="animate-fade-in mt-5 flex items-center justify-center gap-5 text-xs text-slate-500"
          style={{ animationDelay: "0.5s", opacity: 0 }}
        >
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            X API 公式連携
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
            弁護士監修
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            登録不要・無料
          </span>
        </div>
      </div>
    </section>
  );
}
