import { AlertTriangle, EyeOff, HelpCircle, Scale } from "lucide-react";

const items = [
  {
    icon: EyeOff,
    label: "匿名でも特定できる",
    description: "開示請求で身元特定が可能に",
    color: "text-violet-500",
    bg: "bg-violet-50",
    border: "border-violet-100",
  },
  {
    icon: AlertTriangle,
    label: "証拠は消える",
    description: "投稿が削除される前に保全が必要",
    color: "text-indigo-500",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
  },
  {
    icon: HelpCircle,
    label: "該当する条文が分からない",
    description: "何罪に該当するかの判断が難しい",
    color: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    icon: Scale,
    label: "弁護士のハードル",
    description: "相談する前の段階で諦めてしまう",
    color: "text-violet-500",
    bg: "bg-violet-50",
    border: "border-violet-100",
  },
];

export function Problem() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-gradient-blue">
            Problem
          </span>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            誹謗中傷の被害者が泣き寝入りする理由
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4 sm:gap-3">
          {items.map((item) => (
            <div
              key={item.label}
              className={`card-hover flex min-h-[120px] sm:min-h-[160px] flex-col items-center justify-center rounded-2xl border ${item.border} bg-white p-4 sm:p-5 text-center`}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.bg}`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <p className="mt-3 text-sm font-bold">{item.label}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-text-muted">{item.description}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-text-sub">
          このサービスは、これらの課題を<strong className="text-foreground">すべて解決</strong>します。
        </p>
      </div>
    </section>
  );
}
