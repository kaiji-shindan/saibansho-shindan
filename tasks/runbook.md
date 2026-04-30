# 本番リリース Runbook（明日 5/1 ソフトローンチ）

## 全体タイムライン

```
今日 4/30 夕方〜夜:
  ① X API / Anthropic / Supabase / LINE / ドメイン / Vercel 契約 (1〜3時間)
  ② 必要情報を私に共有

明日 5/1 朝〜午後:
  ③ Supabase スキーマ適用
  ④ Vercel デプロイ + DNS 設定
  ⑤ スモークテスト
  ⑥ ソフトローンチ完了

明日以降:
  ⑦ 弁護士スポット相談（電話相談）
  ⑧ 必要なら文言修正再デプロイ
  ⑨ 正式ローンチ（広告開始）
```

---

# 今日 4/30 のユーザー作業

## ステップ 1: X Developer Portal （所要 30分〜1日）

1. https://developer.x.com/ にログイン（既存 X アカウントでOK）
2. 「Sign up for Free Account」→ または直接 Basic 申込
3. **Basic tier ($200/月)** を契約
4. プロジェクト作成 → アプリ作成
5. App settings で:
   - User authentication settings → Set up
   - **Type of App**: `Web App, Confidential client`
   - **Callback URI**: `https://（ドメイン）/api/auth/x/callback`（仮で OK、後で更新可）
   - **Website URL**: `https://（ドメイン）/`
   - **Permissions**: `Read`
6. 取得して送って欲しい:
   - **Bearer Token**（API Keys → Bearer Token）
   - **Client ID**（OAuth 2.0 Client ID）※ Phase 2 用
   - **Client Secret**（OAuth 2.0 Client Secret）※ Phase 2 用

> ⚠️ 審査待ちが発生する場合あり。**最優先で今日のうちに申込を**。

## ステップ 2: Anthropic Console （所要 10分）

1. https://console.anthropic.com/ にログイン
2. **Settings → Limits** で月額 spend limit を `$100` 程度に設定
3. **API Keys → Create Key** で新規作成、名前は `kaiji-shindan-prod`
4. 取得して送って欲しい:
   - **API Key**（`sk-ant-api03-...` で始まる文字列）

> ⚠️ キーは作成時にしか表示されない。コピーし忘れたら作り直し。

## ステップ 3: Supabase （所要 10分）

1. https://supabase.com/ にログイン
2. **New Project** → リージョンは `Northeast Asia (Tokyo)` または `Northeast Asia (Seoul)`
3. Database password はメモ
4. プロジェクト作成完了まで 1〜2分待つ
5. 取得して送って欲しい:
   - **Project URL**（Settings → API → Project URL）
   - **service_role key**（Settings → API → Project API keys → service_role の secret）
6. **`db/schema.sql` の中身を、SQL Editor に貼り付けて Run**（私の方で別途案内可）

## ステップ 4: LINE 公式アカウント （所要 1〜2時間）

1. https://entry.line.biz/ で公式アカウント開設
2. アカウント名: 「開示請求診断」
3. プラン: **コミュニケーションプラン（無料）** で開始
4. **LINE Official Account Manager** にログイン
5. **設定 → 応答設定**:
   - 応答モード: `Bot`
   - あいさつメッセージ: ON
6. **あいさつメッセージ**を設定（下記文面を貼り付け）:

```
ご登録ありがとうございます。
開示請求診断 公式アカウントです。

▼ こちらでお届けする内容
・診断結果の詳細レポート
・問題投稿の全件リスト
・発信者情報開示請求書テンプレート
・誹謗中傷対策に関する一般情報

▼ ご注意
本サービスは公開投稿の整理・分類を行う
情報ツールです。
個別の法的助言や弁護士のご紹介は
行っておりません。

具体的な法的対応をご検討の場合は、
お近くの法律事務所等の専門家へ
直接ご相談ください。
```

7. **友だち追加 URL** を取得（プロフィール画面の「友だち追加」→ URLをコピー）
8. 取得して送って欲しい:
   - **友だち追加 URL**（`https://lin.ee/xxxxxxx`）

## ステップ 5: ドメイン取得 （所要 30分〜DNS反映 1〜24h）

1. お名前.com / Cloudflare Registrar 等でドメイン取得
2. 推奨候補:
   - 第1: `kaiji-shindan.jp`
   - 第2: `kaiji.jp`（短くて空いていれば最強）
3. **WHOIS情報公開代行** を必ずON
4. 念のため `.com` も同名で押さえる（年1,500円程度）
5. 取得後、教えて欲しい:
   - **取得したドメイン名**

## ステップ 6: Vercel 契約 （所要 10分）

1. https://vercel.com/ で GitHub アカウントでサインアップ
2. プラン: **Pro ($20/月)** にアップグレード（商用利用のため）
3. 取得して送って欲しい:
   - **Vercel team の URL**（後で招待してもらえる場合用）

## ステップ 7: 運営事業者情報を確定

`/tokushoho` に記載する情報:
- 販売業者（事業者名）
- 運営責任者氏名
- 所在地（または「ご請求いただければ遅滞なく開示します」）
- 連絡先（メールアドレス）

---

# 明日 5/1 のユーザー × 私の合流ポイント

## 朝: 情報共有

ユーザーから以下が揃ったら、私に共有してください（ChatGPT / Claude / Slack 等の安全な方法で）:

- [ ] X API Bearer Token
- [ ] Anthropic API Key
- [ ] Supabase Project URL + service_role key
- [ ] LINE 友だち追加 URL
- [ ] 取得したドメイン名
- [ ] 運営事業者情報（4項目）
- [ ] Vercel ログイン情報 or プロジェクト権限招待

> ⚠️ Bearer Token / API Key / service_role key は機密情報。共有方法は安全な経路で（テキストファイル直接送るのは避け、1Password 等を推奨）。

## 私の作業（明日午前）

1. ユーザーから受領した情報で `.env.local.example` をベースに `.env.local` 作成・ローカル動作確認
2. Supabase に `db/schema.sql` を貼り付け実行（ユーザーがやってもOK）
3. `/tokushoho` の事業者情報を埋める
4. GitHub リポジトリに push（リポジトリ未作成なら作成）
5. Vercel に GitHub リポジトリを Import
6. 環境変数を `tasks/vercel-env.md` の通り設定
7. Production デプロイ

## DNS 設定（ユーザー作業）

Vercel デプロイ完了後、ドメインレジストラの DNS 設定で:

```
Type: A      Name: @     Value: 76.76.21.21
Type: CNAME  Name: www   Value: cname.vercel-dns.com
```

または Vercel が指示する値に従う（ダッシュボード → Domains で表示される）。

DNS 反映後、HTTPS が自動で有効化される（Let's Encrypt）。

## X OAuth Callback URI 更新

ドメインが本番化したら、X Developer Portal の Callback URI を:
```
https://（本番ドメイン）/api/auth/x/callback
```
に更新（Phase 2 機能のために）。

## 午後: スモークテスト

`tasks/smoke-test.md` の項目を全て確認。問題なければ**ソフトローンチ完了**。

---

# トラブルシューティング想定

| 起きうる事象 | 対処 |
|---|---|
| X API Basic tier の審査が通らない | サポートに連絡。それまで Free tier で動作確認のみ |
| Supabase 無料 tier の制限到達 | 有料 ($25/月) にアップグレード |
| ドメインの DNS 反映が遅い | Vercel の `*.vercel.app` URL でソフトローンチ可（後でドメイン切替） |
| LINE 友だち追加 URL が出ない | LINE Business 認証が完了するまで待つ |

---

# ソフトローンチの定義

**今回のリリースは「ソフトローンチ」**:
- 本番環境にデプロイ完了
- 主要機能が動作する
- ただし対外的な広告・SNS告知はしない
- 弁護士スポット相談 → 文言修正反映後に**正式ローンチ（広告開始）**

これにより、技術的検証は完了させつつ、法務リスクは負わないバランスを取る。
