# 開示請求診断

X（旧 Twitter）アカウントの公開投稿を独自エンジン＋ Claude で分析し、発信者情報開示請求の検討材料を無料で提示するツールです。提携弁護士事務所への B2B 販売を前提としたリード獲得パイプラインを内蔵しています。

## アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────┐
│ ユーザー向け (無料)                                          │
├─────────────────────────────────────────────────────────────┤
│  /                 ランディング LP                            │
│  /diagnose/:user   診断結果ページ (無料で閲覧可能)           │
│  /about            長尺 LP                                   │
│  /for-lawyers      弁護士事務所向け B2B セールス LP          │
└─────────────────────────────────────────────────────────────┘
                │
                │ LINE 友だち追加ゲート
                ▼
┌─────────────────────────────────────────────────────────────┐
│ LINE 登録後の詳細コンテンツ                                  │
├─────────────────────────────────────────────────────────────┤
│  /diagnose/:user/premium     AI総合レポート + 全件証拠リスト │
│  /templates/disclosure-request  開示請求書テンプレ (PDF 化可)│
└─────────────────────────────────────────────────────────────┘
                │
                │ Basic 認証 (弁護士事務所側)
                ▼
┌─────────────────────────────────────────────────────────────┐
│ 管理画面                                                     │
├─────────────────────────────────────────────────────────────┤
│  /admin                ダッシュボード (KPI / チャート / UTM) │
│  /admin/leads          検索 / フィルタ / ページネーション     │
│  /admin/leads/:id      リード詳細 + セッションタイムライン   │
│  /admin/leads.csv      CSV エクスポート                       │
└─────────────────────────────────────────────────────────────┘
```

### 主要な技術要素

| 項目 | 採用技術 |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| DB | Supabase (Postgres) |
| 分析 | X API v2 (Basic tier) + Anthropic Claude Haiku |
| 認証 | X OAuth 2.0 (PKCE) / Admin Basic Auth |
| Analytics | Plausible (opt-in) |
| OG 画像 | next/og (動的 SVG→PNG) |

## セットアップ

### 1. 依存関係

```bash
npm install
```

### 2. 環境変数

`.env.local.example` を `.env.local` にコピーして必要な値を設定します。

#### 必須 (ローンチブロッカー)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# X API (Basic tier $200/月)
X_BEARER_TOKEN=AAAAAAAAAA...

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...

# LINE 公式アカウント
NEXT_PUBLIC_LINE_ADD_FRIEND_URL=https://lin.ee/xxxxxxx

# 管理画面 Basic auth
ADMIN_USER=admin
ADMIN_PASSWORD=<strong-password>

# 公開 URL (OG / canonical / sitemap 用)
NEXT_PUBLIC_SITE_URL=https://diagnose.example.com
```

#### 任意 (本番運用で推奨)

```bash
# Slack 通知 (新規リードが入ったら即時通知)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Plausible analytics
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=diagnose.example.com

# X OAuth 2.0 (ユーザーの X アカウント連携)
X_CLIENT_ID=...
X_CLIENT_SECRET=...
```

### 3. Supabase スキーマ

Supabase プロジェクトの SQL Editor を開き、`db/schema.sql` の内容を貼り付けて実行してください。以下が作成されます:

- `diagnose_cache` — 診断結果キャッシュ (TTL 24h)
- `leads` — リード記録 (kind / UTM / セッション / 外部アカウント ID)
- `leads_by_campaign` — キャンペーン別集計 view

### 4. X Developer Portal 設定

1. https://developer.x.com/ で Basic tier ($200/月) を契約
2. Project を作成し Bearer Token を発行 → `X_BEARER_TOKEN`
3. OAuth 2.0 を使う場合:
   - App type: **Web App, Confidential client**
   - Callback URI: `${NEXT_PUBLIC_SITE_URL}/api/auth/x/callback`
   - Scopes: `users.read tweet.read`
   - Client ID / Secret を `.env.local` に設定

### 5. LINE 公式アカウント

1. https://www.linebiz.com/jp/entry/ で公式アカウントを作成 (無料プランで可)
2. 管理画面 → 友だち追加 → URL (`https://lin.ee/xxxxxxx`) をコピー
3. 自動応答メッセージ を「ご登録ありがとうございます…」等に設定
4. `.env.local` の `NEXT_PUBLIC_LINE_ADD_FRIEND_URL` に設定

### 6. 起動

```bash
npm run dev     # 開発 (http://localhost:3000)
npm run build   # 本番ビルド
npm run start   # 本番起動
npm run lint    # ESLint
```

## デプロイ

### Vercel (推奨)

1. Vercel にリポジトリを import
2. Environment Variables をすべて設定
3. Deploy

`vercel.json` でセキュリティヘッダ (`X-Frame-Options`, `Referrer-Policy`, etc.) および `/admin`・`/api` のキャッシュ無効化が設定されています。

### セルフホスト

```bash
npm run build
PORT=3000 npm run start
```

## ディレクトリ構成

```
src/
├── app/
│   ├── page.tsx                   ランディング
│   ├── layout.tsx                 ルートレイアウト (metadata, analytics)
│   ├── opengraph-image.tsx        動的 OG 画像
│   ├── diagnose/[username]/
│   │   ├── page.tsx               診断結果 (無料)
│   │   ├── client.tsx             Client Component
│   │   ├── opengraph-image.tsx    ユーザーごとの動的 OG
│   │   └── premium/               LINE 登録後のプレミアムレポート
│   ├── for-lawyers/               B2B セールス LP
│   ├── privacy/                   プライバシーポリシー (ドラフト)
│   ├── terms/                     利用規約 (ドラフト)
│   ├── tokushoho/                 特商法表記 (ドラフト)
│   ├── templates/disclosure-request/  印刷可能な請求書テンプレ
│   ├── admin/                     弁護士事務所向け管理画面
│   └── api/
│       ├── diagnose/[username]/   診断 API (レート制限付き)
│       ├── lead/line-click/       LINE クリック記録 API
│       └── auth/x/                X OAuth フロー
├── components/
│   ├── line-gate.tsx              LINE 登録ゲート UI
│   ├── attribution-capture.tsx    UTM first-touch キャプチャ
│   ├── site-footer.tsx            共通フッター
│   └── admin/daily-chart.tsx      管理画面の SVG チャート
├── lib/
│   ├── diagnose.ts                診断オーケストレーション
│   ├── classify-tweets.ts         Claude 分類
│   ├── x-api.ts                   X API v2 client
│   ├── leads.ts                   lead 記録・検索・集計
│   ├── line.ts                    LINE 友だち追加 URL helper
│   ├── x-oauth.ts                 X OAuth 2.0 PKCE helper
│   ├── rate-limit.ts              IP ベースレート制限
│   ├── notify.ts                  Slack 互換 Webhook 通知
│   └── admin-auth.ts              Basic 認証
└── proxy.ts                       Next 16 proxy (旧 middleware)

db/
└── schema.sql                     Supabase 1 ショット SQL
```

## ビジネスモデル (非弁回避)

このプロジェクトは以下の制約下で設計されています:

- **ユーザーから直接月額課金しない** (非弁行為回避)
- 収益化ルートは **提携弁護士事務所へのツール売却 / ライセンス貸出**
- ユーザー向けコンテンツは「診断 → LINE 登録 → 弁護士相談窓口」のリード獲得パイプライン
- 弁護士事務所は管理画面経由で流入ユーザーのリスト (X アカウント / UTM / セッション履歴) を閲覧し、対応を開始する

詳細は `/for-lawyers` ページを参照してください。

## 運用ノート

### レート制限

`/api/diagnose` は X API の Basic tier quota ($200/月) を守るため、IP 単位で:
- 10 req/分
- 60 req/時

を超えると 429 を返します。`src/lib/rate-limit.ts` で調整可能です。本番で大規模にスケールする場合は Redis / Upstash への置き換えを推奨。

### メモリフォールバック

Supabase の env が未設定の場合、`leads` / `diagnose_cache` は in-memory フォールバックで動作します。これは開発専用で、Turbopack dev の worker 分離により CSV export と dashboard の数値が一致しないことがあります。本番では必ず Supabase を設定してください。

### 非弁リスクの運用注意

- 診断結果の文言に「法令違反である」「開示請求できる」等の断定表現は含めない
- 提携弁護士事務所を明示せず、LINE 経由で取次ぎする設計を保つ
- プレミアムコンテンツは「情報整理」の域を出ない

## ライセンス

Private / commercial. 無断転載・二次配布禁止。
