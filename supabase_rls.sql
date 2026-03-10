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
