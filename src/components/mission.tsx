import { Heart, ShieldOff } from "lucide-react";

export function Mission() {
  return (
    <section className="relative overflow-hidden bg-white py-16 sm:py-24">
      <div className="bg-mesh-blue absolute inset-0 opacity-50" />
      <div className="bg-grid-subtle absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-3xl px-5 sm:px-6">
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gradient-blue sm:text-xs">
            Our Mission
          </p>
          <h2 className="mt-3 text-2xl font-extrabold leading-[1.3] tracking-tight sm:text-[2rem]">
            <span className="text-foreground">被害者を助けると同時に、</span>
            <br />
            <span className="text-gradient-blue">加害者を生まないサービス</span>
            <span className="text-foreground">にしたい</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-text-sub sm:text-base">
            泣き寝入りする被害者を一人でも減らし、
            <br className="hidden sm:block" />
            「書く前に立ち止まる人」を一人でも増やすこと。
            <br />
            その両輪が揃って、はじめて誹謗中傷は減ると私たちは考えています。
          </p>
        </div>

        <div className="mt-10 grid gap-3 sm:mt-12 sm:grid-cols-2 sm:gap-4">
          <div className="rounded-3xl border border-border bg-white/80 p-5 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.06)] backdrop-blur-sm sm:p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100">
              <Heart className="h-6 w-6 text-rose-500" />
            </div>
            <h3 className="mt-4 text-base font-extrabold tracking-tight sm:text-lg">被害者の負担を、AIが代行</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-text-sub">
              問題投稿の抽出、該当条文の整理、投稿行動データの可視化──。
              情報の整理を AI が代行し、弁護士相談に必要な資料を一気に揃えられる状態にします。
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-white/80 p-5 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.06)] backdrop-blur-sm sm:p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100">
              <ShieldOff className="h-6 w-6 text-violet-500" />
            </div>
            <h3 className="mt-4 text-base font-extrabold tracking-tight sm:text-lg">「書く前に立ち止まる」抑止力</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-text-sub">
              自分の投稿が客観的に診断される世界になれば、送信ボタンを押す手は止まる。
              法律は変わったのに10年前のままになっているネットの感覚を、AIで埋めていきます。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
