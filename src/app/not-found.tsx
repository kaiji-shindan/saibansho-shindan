import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#0a0a1a] via-[#10102a] to-[#141438] px-5 text-center text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[20%] left-[10%] h-[300px] w-[300px] rounded-full bg-violet-500/10 blur-[120px]" />
        <div className="absolute bottom-[15%] right-[15%] h-[260px] w-[260px] rounded-full bg-indigo-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-md">
        <Image
          src="/logo_icon.png"
          alt="開示請求診断"
          width={64}
          height={64}
          className="mx-auto opacity-90"
        />
        <p className="mt-6 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-violet-300">
          404 NOT FOUND
        </p>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
          ページが見つかりません
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-400">
          お探しのページは移動または削除された可能性があります。
          もしくは URL をもう一度ご確認ください。
        </p>

        <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-400 to-indigo-400 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-violet-500/30 active:scale-[0.97]"
          >
            <ArrowLeft className="h-4 w-4" />
            トップに戻る
          </Link>
          <Link
            href="/about"
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-bold text-slate-200 backdrop-blur-sm active:scale-[0.97]"
          >
            <Search className="h-4 w-4" />
            サービスについて
          </Link>
        </div>
      </div>
    </div>
  );
}
