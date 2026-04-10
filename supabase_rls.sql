-- =====================================================
-- Supabase セキュリティ設定
-- SQL Editor で実行してください
-- =====================================================

-- 1. Row Level Security を有効化（必須）
--    これを設定しないと、誰でもAPIキーなしでデータにアクセスできます
alter table stock enable row level security;

-- 2. anon（未認証）ユーザーに SELECT / INSERT / UPDATE を許可
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
