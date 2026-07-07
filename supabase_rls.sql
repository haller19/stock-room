-- =====================================================
-- Supabase セキュリティ設定
-- SQL Editor で実行してください
-- =====================================================

-- 1. Row Level Security を有効化（必須）
--    これを設定しないと、誰でもAPIキーなしでデータにアクセスできます
alter table stock enable row level security;

-- 2. カテゴリ列を追加（既存テーブル向け・再実行可）
alter table stock
  add column if not exists category text not null default '';

-- 3. anon（未認証）ユーザーに SELECT / INSERT / UPDATE を許可
--    Basic認証でフロントを守り、その内側からのアクセスを許可する設計
create policy "allow_all_for_anon"
  on stock
  for all
  to anon
  using (true)
  with check (true);

-- =====================================================
-- 確認クエリ（実行後に一覧が取れればOK）
-- =====================================================
select * from stock order by name;

-- =====================================================
-- memo テーブル（メモ機能）
-- =====================================================

-- 1. テーブル作成
create table if not exists memo (
  id         uuid        primary key default gen_random_uuid(),
  body       text        not null,
  created_at timestamptz default now()
);

-- 2. RLS 有効化
alter table memo enable row level security;

-- 3. anon ユーザーに全操作を許可
create policy "allow_all_for_anon"
  on memo
  for all
  to anon
  using (true)
  with check (true);

-- 4. 認証済みユーザーに全操作を許可
create policy "allow_all_for_authenticated"
  on memo
  for all
  to authenticated
  using (true)
  with check (true);

-- 確認
select * from memo order by created_at desc;

-- =====================================================
-- push_subscriptions テーブル（Web Push 通知購読）
-- =====================================================

-- 1. テーブル作成
create table if not exists push_subscriptions (
  id           uuid        primary key default gen_random_uuid(),
  endpoint     text        unique not null,
  subscription jsonb       not null,
  user_email   text,
  user_agent   text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- 2. RLS 有効化
alter table push_subscriptions enable row level security;

-- 3. 認証済みユーザーに全操作を許可
create policy "allow_all_for_authenticated"
  on push_subscriptions
  for all
  to authenticated
  using (true)
  with check (true);

-- 確認
select endpoint, user_email, created_at, updated_at from push_subscriptions order by updated_at desc;
