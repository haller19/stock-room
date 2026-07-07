// ===== SUPABASE CONFIG =====
const SUPABASE_URL = 'https://XXXX.supabase.co';
const SUPABASE_KEY = 'sb_publishable___XXXX';
const PUSH_VAPID_PUBLIC_KEY = 'VAPID_PUBLIC_KEY_HERE';

// 認証ヘッダーはアクセストークンを使って都度生成
function getHeaders(accessToken) {
  return {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + (accessToken || SUPABASE_KEY),
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
}

// ===== アクセス許可アカウント =====
const ALLOWED_EMAILS = [
  'test@gmail.com',
  'hoge@gmail.com'
];
