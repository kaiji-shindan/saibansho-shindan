import type { Metadata } from "next";
import { PrintButton } from "./print-button";

export const metadata: Metadata = {
  title: "発信者情報開示請求書（参考フォーマット）",
  description:
    "発信者情報開示請求書の参考フォーマット。記入例付き。ブラウザの印刷機能で PDF として保存できます。",
  robots: { index: false, follow: true },
};

// ============================================================
// 発信者情報開示請求書（参考フォーマット）
//
// ブラウザの印刷機能で PDF 化できるように、print 用 CSS を
// 埋め込んだ A4 1枚構成の HTML。最終版は弁護士監修が必要。
// ============================================================

export default function DisclosureRequestTemplatePage() {
  return (
    <>
      <style
        // Print styles — A4 縦、余白、背景色印刷
        dangerouslySetInnerHTML={{
          __html: `
            @page { size: A4; margin: 18mm 16mm; }
            @media print {
              .no-print { display: none !important; }
              body { background: white !important; }
              .print-sheet { box-shadow: none !important; border: none !important; padding: 0 !important; }
            }
            .jp-doc { font-feature-settings: "palt"; }
          `,
        }}
      />

      <div className="min-h-screen bg-slate-100 py-10 jp-doc">
        {/* ===== Toolbar (screen only) ===== */}
        <div className="no-print mx-auto mb-6 flex max-w-[820px] items-center justify-between px-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600">Template</p>
            <h1 className="text-xl font-extrabold tracking-tight">
              発信者情報開示請求書（参考フォーマット）
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              ブラウザの印刷機能で PDF として保存できます（Chrome: ⌘ P → 送信先を「PDF に保存」）
            </p>
          </div>
          <PrintButton />
        </div>

        {/* ===== Printable sheet ===== */}
        <div
          className="print-sheet mx-auto max-w-[820px] rounded-sm bg-white p-[42px] text-[13px] leading-[1.85] text-slate-900 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.12)]"
          style={{ fontFamily: '"Yu Mincho", "YuMincho", "Hiragino Mincho ProN", serif' }}
        >
          <header className="text-center">
            <h2 className="text-[22px] font-extrabold tracking-wide">発信者情報開示請求書</h2>
            <p className="mt-4 text-right">
              提出日: 　　　　年　　月　　日
            </p>
          </header>

          <section className="mt-8">
            <p>　　　　　　　　　　　　　　 御中</p>
            <p className="mt-6">
              請求者　住所:<span className="ml-2 inline-block w-[420px] border-b border-slate-400" />
            </p>
            <p className="mt-2">
              　　　　氏名:<span className="ml-2 inline-block w-[420px] border-b border-slate-400" />　㊞
            </p>
            <p className="mt-2">
              　　　　連絡先:<span className="ml-2 inline-block w-[420px] border-b border-slate-400" />
            </p>
          </section>

          <section className="mt-8">
            <p className="font-bold">記</p>
            <p className="mt-3">
              　下記のとおり、プロバイダ責任制限法第５条に基づき、発信者情報の開示を請求します。
            </p>
          </section>

          <section className="mt-6">
            <h3 className="border-l-4 border-violet-500 pl-2 text-[14px] font-bold">
              1. 開示を請求する発信者情報
            </h3>
            <ol className="mt-2 list-decimal space-y-0.5 pl-6">
              <li>発信者の氏名又は名称</li>
              <li>発信者の住所</li>
              <li>発信者の電話番号</li>
              <li>発信者の電子メールアドレス</li>
              <li>発信者が侵害情報の送信のために用いたIPアドレスおよびポート番号</li>
              <li>上記 IP アドレスを割り当てられた電気通信設備から当該発信者情報の送信のために用いられた移動端末番号</li>
              <li>発信時のタイムスタンプ</li>
            </ol>
          </section>

          <section className="mt-6">
            <h3 className="border-l-4 border-violet-500 pl-2 text-[14px] font-bold">
              2. 掲載された情報
            </h3>
            <table className="mt-2 w-full border-collapse">
              <tbody className="text-[12px]">
                <tr>
                  <td className="w-[150px] border border-slate-400 bg-slate-50 px-2 py-2 font-bold">
                    掲載場所・URL
                  </td>
                  <td className="border border-slate-400 px-2 py-2">&nbsp;</td>
                </tr>
                <tr>
                  <td className="border border-slate-400 bg-slate-50 px-2 py-2 font-bold">
                    投稿日時
                  </td>
                  <td className="border border-slate-400 px-2 py-2">&nbsp;</td>
                </tr>
                <tr>
                  <td className="border border-slate-400 bg-slate-50 px-2 py-2 font-bold">
                    投稿内容
                  </td>
                  <td className="border border-slate-400 px-2 py-2 h-[80px] align-top">&nbsp;</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="mt-6">
            <h3 className="border-l-4 border-violet-500 pl-2 text-[14px] font-bold">
              3. 侵害された権利
            </h3>
            <div className="mt-2 space-y-1 pl-4">
              <p>□ 名誉毀損　　□ 侮辱　　□ プライバシー権侵害　　□ 肖像権侵害</p>
              <p>□ 著作権侵害　　□ 業務妨害　　□ その他（　　　　　　　　　　　　）</p>
            </div>
          </section>

          <section className="mt-6">
            <h3 className="border-l-4 border-violet-500 pl-2 text-[14px] font-bold">
              4. 権利が侵害されたとする理由
            </h3>
            <div className="mt-2 h-[110px] border border-slate-400 p-2 text-[12px] text-slate-400">
              （例：当該投稿は虚偽の事実を摘示しており、請求者の社会的評価を低下させるものである。
              具体的には…）
            </div>
          </section>

          <section className="mt-6">
            <h3 className="border-l-4 border-violet-500 pl-2 text-[14px] font-bold">
              5. 発信者情報の開示を受けるべき正当な理由
            </h3>
            <div className="mt-2 space-y-1 pl-4 text-[12px]">
              <p>□ 損害賠償請求のため　　□ 謝罪広告等の名誉回復措置を求めるため</p>
              <p>□ 差止請求のため　　□ 刑事告訴のため　　□ その他（　　　　　　　）</p>
            </div>
          </section>

          <section className="mt-8 border-t border-slate-300 pt-4 text-[11px] leading-relaxed text-slate-600">
            <p className="font-bold">【重要】本書式は参考フォーマットです</p>
            <p className="mt-1">
              実際の請求にあたっては必ず弁護士の監修を受けてください。プロバイダや事案により
              記載事項の追加・修正が必要となる場合があります。
            </p>
          </section>
        </div>

        <p className="no-print mx-auto mt-6 max-w-[820px] px-5 text-[11px] text-slate-500">
          ※ 本テンプレートは 2022 年の侮辱罪厳罰化・2024 年の改正プロバイダ責任制限法を踏まえた
          一般的な記載例です。個別事案への適用可否は弁護士にご確認ください。
        </p>
      </div>
    </>
  );
}
