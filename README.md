# zaiko — 日用品ストック管理アプリ

家族2人で使う日用品の在庫を、できるだけ素早く登録・更新・確認するためのWebアプリです。

---

## 概要

| 項目 | 内容 |
|---|---|
| 用途 | 日用品ストックの在庫管理 |
| 利用者 | 2人（家族） |
| 形式 | PWA対応Webアプリ |
| URL | `https://yourdomain.com/stock-room/` |
| ログインURL | `https://yourdomain.com/stock-room/login/` |

---

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | HTML / CSS / Vanilla JS（シングルページ） |
| データベース | Supabase（PostgreSQL） |
| 認証 | Supabase Auth + Google OAuth |
| ホスティング | Xserver |
| PWA | Service Worker + Web App Manifest |

外部フレームワーク・ビルドツール不要。ファイルをアップロードするだけで動作します。

---

## ファイル構成

```
stock-room/
├── index.html               # アプリ本体（認証済みユーザーのみ表示）
├── config.js                # Supabase設定・許可アカウント定義
├── manifest.json            # PWAマニフェスト
├── service-worker.js        # Service Worker（キャッシュ制御、現在 zaiko-v7）
├── favicon.ico              # ファビコン
├── zaiko_header_logo.svg    # ヘッダーロゴ
├── login/
│   └── index.html           # ログイン画面（/stock-room/login/）
└── icons/
    ├── icon-180.png         # iOS ホーム画面アイコン（apple-touch-icon）
    ├── icon-192.png         # PWAアイコン（Android等）
    └── icon-512.png         # PWAアイコン（スプラッシュ等）
```

---

## 機能一覧

### 在庫操作
- **入庫** — 品目を選択（または新規登録）して数量・保管場所を入力
- **出庫** — 品目を選択して数量を減らす。在庫0未満はバリデーションで禁止
- **在庫一覧** — 品名・在庫数・保管場所を一覧表示。品名で絞り込み検索可能

### 編集・削除
- **行クリック編集** — 在庫一覧の行をクリックすると品名・保管場所をインライン編集
- **削除モード** — 一覧右上の「削除する」ボタンで各行に削除ボタンを表示。確認ダイアログあり

### 保管場所入力
- 既存の保管場所をチップボタンとして表示。タップで即入力
- 新しい保管場所は自由入力も可能

### 自動更新
- 60秒ごとにSupabaseからデータを再取得して一覧を自動更新
- アプリがバックグラウンドから復帰したタイミングでも即リフレッシュ
- データに変化がない場合は再描画しない

### 認証
- Googleアカウント認証（Supabase Auth + Google OAuth）
- 許可アカウントのみアクセス可能（`config.js` の `ALLOWED_EMAILS` で管理）
- セッションは自動更新されるため、通常は再ログイン不要
- ログアウト後は `/stock-room/login/` にリダイレクト

### PWA
- iPhoneのSafariから「ホーム画面に追加」でアプリとして起動可能
- ブラウザUIなしの全画面表示（スタンドアロンモード）
- 静的ファイルをService Workerでキャッシュし、2回目以降の起動を高速化

---

## 設定ファイル（config.js）

```javascript
const SUPABASE_URL = 'https://xxxx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_...';

const ALLOWED_EMAILS = [
  'user1@gmail.com',
  'user2@gmail.com'
];
```

アクセスを許可するGoogleアカウントのメールアドレスをここで管理します。
追加・変更は `config.js` だけ編集してアップロードしてください。

---

## データベース（Supabase）

### テーブル: stock

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid | 主キー（自動生成） |
| name | text | 品名（ユニーク） |
| qty | integer | 在庫数（0以上） |
| box | text | 保管場所（箱番号） |
| created_at | timestamptz | 作成日時 |

### RLSポリシー

```sql
-- 認証済みユーザーのみ全操作を許可
create policy "allow_authenticated"
  on stock for all
  to authenticated
  using (true) with check (true);
```

---

## Service Worker キャッシュ戦略

| リソース | 戦略 |
|---|---|
| 静的ファイル（HTML/JS/SVG等） | キャッシュ優先、なければネットワーク取得 |
| Supabase API（GET） | ネットワーク優先、失敗時はキャッシュにフォールバック |
| Supabase API（POST/PATCH/DELETE） | 常にネットワーク（キャッシュしない） |
| chrome-extension等 | スキップ（キャッシュしない） |

### キャッシュ更新方法

`service-worker.js` の1行目のバージョン番号を上げてアップロードしてください。

```javascript
const CACHE_VERSION = 'zaiko-v7'; // → 'zaiko-v8' に変更
```

---

## Supabase外部サービス設定

### Authentication > URL Configuration

| 項目 | 値 |
|---|---|
| Site URL | `https://yourdomain.com/stock-room/` |
| Redirect URLs | `https://yourdomain.com/stock-room/` |

### Authentication > Sign In / Providers
- Google OAuth を有効化
- Google Cloud Console で取得した Client ID / Client Secret を設定

---

## デプロイ手順

1. XserverのファイルマネージャーまたはFTPで `public_html/stock-room/` にファイルをアップロード
2. `config.js` の `SUPABASE_URL` / `SUPABASE_KEY` / `ALLOWED_EMAILS` を確認
3. ブラウザで `https://yourdomain.com/stock-room/login/` にアクセスして動作確認

---

## アカウント追加方法

`config.js` の `ALLOWED_EMAILS` に追加してアップロードするだけです。

```javascript
const ALLOWED_EMAILS = [
  'user1@gmail.com',
  'user2@gmail.com',
  'user3@gmail.com'  // 追加
];
```

---

## 注意事項

- `config.js` にはAPIキーと許可アカウント情報が含まれます。Gitリポジトリで管理する場合は `.gitignore` に追加してください
- Supabase無料プランの制限：月50万APIリクエスト。2人での通常利用では問題ないはず
- Service Worker更新後に反映されない場合は、ブラウザのキャッシュをクリアしてください（Chrome: DevTools → Application → Storage → Clear site data）
