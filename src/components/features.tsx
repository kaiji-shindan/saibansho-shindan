import {
  Brain,
  MessageSquareWarning,
  BarChart3,
  FileCheck,
  Shield,
  Clock,
} from "lucide-react";

// ============================================================
// Features — X API Basic tier + Claude で実際に取得・計算できる機能のみ
// ============================================================
const features = [
  {
    icon: Brain,
    title: "AI による投稿分類",
    description:
      "直近の公開投稿を AI で名誉毀損・侮辱・脅迫・プライバシー侵害の 4 カテゴリに自動分類。",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    icon: MessageSquareWarning,
    title: "リスクレベル判定",
    description: "独自のスコアリングで S〜E の 6 段階で開示請求レベルを即時判定。",
    color: "text-violet-500",
    bg: "bg-violet-50",
  },
  {
    icon: BarChart3,
    title: "投稿パターン分析",
    description:
      "投稿頻度・時間帯・言語・メディア構成を実データから可視化。NG ワードの出現回数もカウント。",
    color: "text-indigo-500",
    bg: "bg-indigo-50",
  },
  {
    icon: Clock,
    title: "アカウント情報の可視化",
    description:
      "フォロワー・フォロー・総投稿数・アカウント作成日などの公開プロフィール情報を一覧表示。",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    icon: FileCheck,
    title: "開示請求書テンプレート",
    description:
      "発信者情報開示請求書の参考フォーマットを提供。ブラウザの印刷機能で PDF 保存可能。",
    color: "text-violet-500",
    bg: "bg-violet-50",
  },
  {
    icon: Shield,
    title: "証拠保全と検討材料の整理",
    description: "公開投稿のスナップショットを構造化し、専門家への相談を検討する際の材料として整理します。",
    color: "text-indigo-500",
    bg: "bg-indigo-50",
  },
];

export function Features() {
  return (
    <section id="features" className="py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-gradient-blue">
            Features
          </span>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            できること
          </h2>
          <p className="mt-2 text-xs text-text-muted">
            ※ 分析対象は X の公開投稿に限定されます
          </p>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="card-hover group flex min-h-[130px] sm:min-h-[150px] flex-col rounded-2xl border border-border bg-white p-4 sm:p-5"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${feature.bg}`}>
                <feature.icon className={`h-5 w-5 ${feature.color}`} />
              </div>
              <h3 className="mt-3 text-sm font-bold">{feature.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-text-muted">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
