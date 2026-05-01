# LIFF + Messaging API デプロイ後セットアップ

LIFF コードがデプロイされた後にユーザー側で行うべき設定。

## ① Vercel に環境変数を追加（3 つ）

Vercel ダッシュボード → プロジェクト → Environment Variables → Add

```env
LINE_CHANNEL_ACCESS_TOKEN=MCkhGqPPSLqXlwfA8G/8GJxFeim/taQzUAFgSoaEHlJ0oe3eUnSCr7QDz4uO2edpENza9YZkOd+INEeZCg9M1xIrz3nK/+T2knvtgrnz/853Ae/b1trKzqFtvm8Jm81fROxobLDT3pHNepMxFd6XwQdB04t89/1O/w1cDnyilFU=
LINE_CHANNEL_SECRET=d190558a80e854e47f5a98d5591e402a
NEXT_PUBLIC_LIFF_ID=2009951453-VVulCXvC
```

各変数:
- Production と Preview にチェック
- Sensitive: ON（推奨）
- 設定後 Redeploy トリガー

## ② Supabase に line_pending_links テーブル追加

Supabase → SQL Editor → New query → 下記を実行:

```sql
create table if not exists line_pending_links (
  line_user_id     text primary key,
  pending_username text not null,
  display_name     text,
  created_at       timestamptz not null default now()
);

create index if not exists line_pending_links_created_at_idx
  on line_pending_links(created_at);

alter table line_pending_links enable row level security;
```

## ③ LINE Developers Console で Webhook URL 設定

LINE Developers Console → Provider「kaiji-shindan」→ Channel「開示請求診断」(Messaging API) → 上部タブ「Messaging API設定」

```
Webhook URL: https://saibansho-shindan.vercel.app/api/webhook/line
Use webhook: ON
```

「Verify」ボタンでテストして 200 が返れば OK。

## ④ LINE Official Account Manager で自動応答を無効化

manager.line.biz → アカウント選択 → 設定 → 応答設定

```
応答モード: Bot
あいさつメッセージ: OFF  ← 重要（カスタムメッセージで送るため）
応答メッセージ: ON のままで OK（キーワード応答用、後で設定可）
Webhook: ON
```

⚠️ あいさつメッセージを OFF にしないと、固定文面と Webhook 経由のパーソナライズメッセージが**両方届く**ことになる。
