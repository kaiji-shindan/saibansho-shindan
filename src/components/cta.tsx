"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { parseUsername } from "@/lib/parse-username";

export function Cta() {
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
    <section className="relative py-16 sm:py-20 bg-surface-dark text-white overflow-hidden">
      <div className="bg-dots-dark absolute inset-0 opacity-40" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[120px]" />

      <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-4xl">
          誹謗中傷を、客観的に可視化する。
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-white/60">
          まずは無料で診断。法的リスクの可能性を構造化された情報として確認できます。
        </p>

        <form onSubmit={handleSubmit} className="mx-auto mt-8 max-w-md">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-sm transition-all focus-within:border-primary/50">
            <span className="pl-3 text-lg font-bold text-white/30">@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ユーザー名を入力"
              className="flex-1 bg-transparent py-2.5 text-base text-white outline-none placeholder:text-white/30"
            />
            <button
              type="submit"
              className="group flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-400 to-indigo-400 px-5 py-2.5 text-sm font-bold text-white transition-all hover:from-violet-500 hover:to-indigo-500 active:scale-95"
            >
              診断
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </form>

        <p className="mt-4 text-xs text-white/40">
          無料 / 登録不要 / 10秒で結果表示
        </p>
      </div>
    </section>
  );
}
