-- ============================================================
-- 開示請求診断 — Supabase schema (one-shot setup)
--
-- 実行方法:
--   Supabase プロジェクトの SQL Editor に貼り付けて Run。
--   既存テーブルがあれば ALTER で差分を反映。
--
-- 想定ユーザー:
--   弁護士事務所への B2B 引き渡し時に、このファイル 1 つで
--   環境構築が完了するようにしている。
-- ============================================================

-- ------------------------------------------------------------
-- 1. diagnose_cache — 診断結果キャッシュ
--    X API 呼び出しを減らすための層。TTL はアプリ側で管理。
-- ------------------------------------------------------------
create table if not exists diagnose_cache (
  username     text primary key,
  data         jsonb not null,
  analyzed_at  timestamptz not null default now()
);

create index if not exists diagnose_cache_analyzed_at_idx
  on diagnose_cache(analyzed_at);

-- ------------------------------------------------------------
-- 2. leads — リード記録（本プロジェクトの B2B コア資産）
--
--   kind が何のイベントかを表す:
--     - diagnose         : 診断 API がヒット (誰がどの X アカウントを調べたか)
--     - line_click       : LINE 登録ボタンがクリックされた (≒ 登録意向)
--     - line_registered  : LINE Login 成功後 (将来実装)
--     - x_oauth          : X OAuth 成功後 (将来実装)
--
--   session_id は cookie (kaiji_sid) で採番した擬似匿名 ID。
--   同一セッションの複数イベントはこれで紐付く。
-- ------------------------------------------------------------
create table if not exists leads (
  id             bigserial primary key,
  kind           text not null check (kind in ('diagnose','line_click','line_registered','x_oauth')),
  query_username text,
  session_id     text,
  line_user_id   text,
  x_user_id      text,
  user_agent     text,
  ip             text,
  referrer       text,
  -- UTM / キャンペーン attribution (tk 社 X 広告からの流入を追跡)
  utm_source     text,
  utm_medium     text,
  utm_campaign   text,
  utm_content    text,
  utm_term       text,
  landing_path   text,
  created_at     timestamptz not null default now()
);

create index if not exists leads_kind_idx         on leads(kind);
create index if not exists leads_created_at_idx   on leads(created_at desc);
create index if not exists leads_session_idx      on leads(session_id);
create index if not exists leads_username_idx     on leads(query_username);
create index if not exists leads_utm_campaign_idx on leads(utm_campaign);

-- 既存テーブルがあった場合に備えた idempotent ALTER
-- (Supabase の SQL Editor で複数回実行しても安全)
do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_name = 'leads' and column_name = 'utm_source') then
    alter table leads add column utm_source   text;
    alter table leads add column utm_medium   text;
    alter table leads add column utm_campaign text;
    alter table leads add column utm_content  text;
    alter table leads add column utm_term     text;
    alter table leads add column landing_path text;
    create index if not exists leads_utm_campaign_idx on leads(utm_campaign);
  end if;
end $$;

-- ------------------------------------------------------------
-- 3. RLS (Row Level Security)
--    Service role key からのアクセスのみ許可する。
--    (Next.js バックエンドは SUPABASE_SERVICE_ROLE_KEY を使う想定)
-- ------------------------------------------------------------
alter table leads          enable row level security;
alter table diagnose_cache enable row level security;

-- service role は bypass されるので明示的なポリシーは不要。
-- anon/authenticated からは一切アクセス不可。
-- (既存ポリシーがある場合は何もしない)

-- ------------------------------------------------------------
-- 4. line_pending_links — LIFF→friend-add で username を保持
--    LIFF で取得した LINE userId と診断対象 username を紐付け、
--    follow webhook が来た時にパーソナライズメッセージを送るのに使う。
-- ------------------------------------------------------------
create table if not exists line_pending_links (
  line_user_id     text primary key,
  pending_username text not null,
  display_name     text,
  created_at       timestamptz not null default now()
);

create index if not exists line_pending_links_created_at_idx
  on line_pending_links(created_at);

alter table line_pending_links enable row level security;

-- ------------------------------------------------------------
-- 5. 便利 View: キャンペーン別リード数
-- ------------------------------------------------------------
create or replace view leads_by_campaign as
select
  coalesce(utm_campaign, '(direct)') as campaign,
  coalesce(utm_source,   '(direct)') as source,
  count(*) filter (where kind = 'diagnose')    as diagnoses,
  count(*) filter (where kind = 'line_click')  as line_clicks,
  count(distinct session_id)                   as unique_sessions,
  count(distinct query_username)               as unique_usernames,
  max(created_at)                              as last_seen
from leads
group by 1, 2
order by diagnoses desc;
