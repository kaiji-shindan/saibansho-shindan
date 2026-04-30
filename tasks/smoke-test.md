# 本番デプロイ後 スモークテスト

各項目をチェックしながら進める。NG があれば原因を切り分けて再デプロイ。

---

## 1. 基本ルーティング

ブラウザで以下にアクセスし、200 で表示されるか確認:

- [ ] `https://（ドメイン）/` — トップページ
- [ ] `https://（ドメイン）/about` — サービスについて
- [ ] `https://（ドメイン）/privacy` — プライバシーポリシー
- [ ] `https://（ドメイン）/terms` — 利用規約
- [ ] `https://（ドメイン）/tokushoho` — 特商法表記
- [ ] `https://（ドメイン）/for-lawyers` — 弁護士事務所向けLP
- [ ] `https://（ドメイン）/sitemap.xml` — XMLが返る
- [ ] `https://（ドメイン）/robots.txt` — テキストが返る

### 確認ポイント
- [ ] HTTPS が有効
- [ ] ロゴ・画像が正しく表示
- [ ] フッターのリンクが本番ドメインで動く

---

## 2. 診断機能（X API + Anthropic 連携）

公開かつ安全な X アカウント（自分のアカウント or 公的人物のアカウント）で動作確認:

- [ ] トップページで X username を入力 → 「実行」ボタン
- [ ] `/diagnose/[username]` に遷移
- [ ] 数秒〜10秒以内に診断結果が表示される
- [ ] スコア・レベル・カテゴリ別件数が表示される
- [ ] 該当投稿リストが表示される
- [ ] アバター画像（unavatar.io 経由）が表示される
- [ ] 「投稿が削除される前に証拠保全を」のバナーが表示される
- [ ] LINE ゲートカードが表示される

### NG の場合
- ロード中で止まる: API キーが正しく設定されているか確認
- エラーページ: Vercel の Function Logs で詳細確認
- レート制限エラー: `/api/diagnose` の rate limit が効いている可能性

---

## 3. LINE 友だち追加フロー

- [ ] 診断結果ページの LINE ゲートカードの「LINEで詳細レポートを受け取る」をクリック
- [ ] LINE 公式アカウントが開く
- [ ] あいさつメッセージが表示される
- [ ] 元のページに戻ると、ゲートが解放されている
- [ ] `/diagnose/[username]/premium` にアクセスできる
- [ ] プレミアムレポートの内容が表示される

### Supabase 確認
Supabase の SQL Editor で:
```sql
select * from leads order by created_at desc limit 10;
```
- [ ] `kind = 'line_click'` のレコードが入っている
- [ ] `kind = 'diagnose'` のレコードも入っている

---

## 4. 管理画面

- [ ] `https://（ドメイン）/admin` にアクセス
- [ ] Basic 認証ダイアログが出る
- [ ] `ADMIN_USER` / `ADMIN_PASSWORD` で認証成功
- [ ] ダッシュボードが表示される
- [ ] KPI カードに数値が入っている（少なくとも `診断数` が `1` 以上）
- [ ] 日次トレンドチャートが表示される

### サブページ
- [ ] `/admin/leads` でリードリストが見える
- [ ] `/admin/leads/[id]` で個別リード詳細が見える
- [ ] `/admin/leads.csv` で CSV がダウンロードできる

---

## 5. SEO / ソーシャル

- [ ] `https://（ドメイン）/` の HTML ソースに `<meta name="robots" content="...">` が適切
- [ ] `https://（ドメイン）/admin` の HTML ソースに `noindex` が含まれる
- [ ] `https://（ドメイン）/api/*` のレスポンスヘッダに `X-Robots-Tag: noindex` がある
- [ ] OG 画像が正しく生成される（`/opengraph-image` URL）
- [ ] Twitter Card / Facebook Sharing Debugger で URL を入れて検証
  - https://cards-dev.twitter.com/validator（動かない場合は X 上で実際に貼って確認）

---

## 6. パフォーマンス

Chrome DevTools の Lighthouse でモバイル測定:
- [ ] LCP < 2.5s
- [ ] CLS < 0.1
- [ ] TBT < 200ms

不合格でも今日のソフトローンチには影響なし（後で改善）。

---

## 7. レート制限

意図的に連打して 429 が返るか確認:
```bash
for i in {1..15}; do curl -I https://（ドメイン）/api/diagnose/elonmusk; done
```
- [ ] 11回目以降で 429 が返る

---

## 8. Slack / 通知（設定した場合）

- [ ] LINE 友だち追加クリックで Slack に通知が飛ぶ

---

## 9. セキュリティヘッダ

```bash
curl -I https://（ドメイン）/
```
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy: camera=(), microphone=(), geolocation=()`

```bash
curl -I https://（ドメイン）/admin
```
- [ ] `X-Robots-Tag: noindex, nofollow`
- [ ] `Cache-Control: no-store`

---

## 10. 最終確認

- [ ] スマホ実機（iPhone / Android）で診断〜LINE登録の動線が正常に動く
- [ ] 「弁護士事務所への取次」「無料相談」等の旧文言が**残っていないか**ページを目視確認
- [ ] `/tokushoho` の事業者情報が正しく入っている

---

# 通過したら

✅ **ソフトローンチ完了！**

明日以降:
1. 弁護士スポット相談（電話相談で OK）
2. 必要なら文言修正
3. 広告・SNS告知で正式ローンチ
