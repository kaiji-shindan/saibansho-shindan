# Vercel Environment Variables 設定リスト

## 設定先
Vercel ダッシュボード → プロジェクト → Settings → Environment Variables

各変数を **Production** と **Preview** の両方に登録する。

---

## 🔴 必須（リリースブロッカー）

| 変数名 | 値の例 | 取得元 | 備考 |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxxx.supabase.co` | Supabase Project Settings → API | プロジェクト URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJI...` | Supabase Project Settings → API → service_role | **絶対に公開しない**。`anon key` ではなく `service_role key` |
| `X_BEARER_TOKEN` | `AAAAAAAAAA...` | X Developer Portal → Project → Keys and Tokens → Bearer Token | Basic tier 必須 |
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | console.anthropic.com → API Keys | 月額上限を必ず設定 |
| `NEXT_PUBLIC_LINE_ADD_FRIEND_URL` | `https://lin.ee/xxxxxxx` | LINE Official Account Manager → 友だち追加 → URL | 公開してOK |
| `ADMIN_USER` | `admin` | 任意 | 管理画面ID |
| `ADMIN_PASSWORD` | （32文字以上のランダム） | `openssl rand -base64 32` で生成 | 弁護士事務所営業時のデモ用 |
| `NEXT_PUBLIC_SITE_URL` | `https://kaiji-shindan.jp` | 取得した独自ドメイン | OG / canonical / sitemap で参照 |

---

## 🟡 推奨（本番運用品質向上）

| 変数名 | 値の例 | 用途 |
|---|---|---|
| `SLACK_WEBHOOK_URL` | `https://hooks.slack.com/...` | 新規リード通知 |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | `kaiji-shindan.jp` | アクセス解析（プライバシー重視） |

## 🟢 任意（Phase 2 で使用）

| 変数名 | 値の例 | 用途 |
|---|---|---|
| `X_CLIENT_ID` | （Confidential client ID） | X OAuth 2.0 連携 |
| `X_CLIENT_SECRET` | （Client Secret） | X OAuth 2.0 連携 |

## 動作モード

| 変数名 | 値 | 用途 |
|---|---|---|
| `USE_MOCK` | `false` | 本番で必ず false |
| `DIAGNOSE_CACHE_TTL` | `86400` | 診断キャッシュ TTL (秒)。デフォルト 24h |

---

## ⚠️ Vercel での設定手順

1. Vercel ダッシュボード → プロジェクト → Settings → Environment Variables
2. 各変数を入力 → Environment は **Production** と **Preview** にチェック（Development はローカル用なので不要）
3. Save
4. **重要**: 環境変数追加後は再デプロイが必要。Settings → Deployments → 最新 → Redeploy

---

## ADMIN_PASSWORD 生成コマンド

ターミナルで実行:

```bash
openssl rand -base64 32
```

出力例:
```
xK9mP2vN8qR4tY7uI1oA3sD5fG8hJ0kL2mN4bV6cX8z=
```

これを `ADMIN_PASSWORD` の値に設定する。

---

## チェックリスト

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `X_BEARER_TOKEN`
- [ ] `ANTHROPIC_API_KEY`
- [ ] `NEXT_PUBLIC_LINE_ADD_FRIEND_URL`
- [ ] `ADMIN_USER`
- [ ] `ADMIN_PASSWORD`（強パスワード）
- [ ] `NEXT_PUBLIC_SITE_URL`（独自ドメイン）
- [ ] `USE_MOCK=false`

すべてチェックが入ったら `npm run build` がエラーなく通ることを確認 → Vercel で Redeploy。
