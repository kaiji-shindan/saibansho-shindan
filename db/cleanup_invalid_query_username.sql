-- ============================================================
-- leads.query_username が X 公式仕様 (^[A-Za-z0-9_]{1,15}$) に
-- マッチしない行を一括削除する一回限りの保守スクリプト。
--
-- 背景:
--   フォームのバリデーション追加前に、ユーザーが全角日本語等を
--   誤入力したリードが leads テーブルに混入していた。
--   B2B 引き渡し時に弁護士事務所が混乱しないよう除去する。
--
-- 実行方法:
--   Supabase の SQL Editor に貼り付け、①②で対象を確認したあと
--   ③ のブロックを選択して実行する。
--
-- 注意:
--   query_username が NULL の行は対象外 (NULL !~ regex は NULL)。
--   PostgreSQL の `~` は POSIX 正規表現。`[A-Za-z0-9_]{1,15}` 可。
-- ============================================================

-- ① 削除対象の件数 (kind 別内訳)
select
  kind,
  count(*) as rows_to_delete
from leads
where query_username is not null
  and query_username !~ '^[A-Za-z0-9_]{1,15}$'
group by kind
order by rows_to_delete desc;

-- ② サンプル確認 (直近 50 件)
select id, kind, query_username, session_id, created_at
from leads
where query_username is not null
  and query_username !~ '^[A-Za-z0-9_]{1,15}$'
order by created_at desc
limit 50;

-- ③ 実削除 (①② の結果に納得してから、このブロックだけを選択して実行)
--    トランザクションで囲んでいるので、想定外の削除件数なら ROLLBACK 可能。
/*
begin;

with deleted as (
  delete from leads
  where query_username is not null
    and query_username !~ '^[A-Za-z0-9_]{1,15}$'
  returning id
)
select count(*) as deleted_count from deleted;

-- 想定通りなら commit、違ったら rollback に書き換えて再実行
commit;
*/
