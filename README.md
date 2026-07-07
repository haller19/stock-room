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
├── service-worker.js        # Service Worker（キャッシュ制御、現在 zaiko-v14）
├── favicon.ico              # ファビコン
├── zaiko_header_logo.svg    # ヘッダーロゴ
├── images/                  # 下部ナビ用SVGアイコン
├── login/
│   └── index.html           # ログイン画面（/stock-room/login/）
└── icons/
    ├── icon-180.png         # iOS ホーム画面アイコン（apple-touch-icon）
    ├── icon-192.png         # PWAアイコン（Android等）
    └── icon-512.png         # PWAアイコン（スプラッシュ等）
```

---

## 機能一覧

### ページ内ナビ
- 画面下部のナビゲーションで「ホーム」「メモ」「入庫・出庫」「検索」を切り替え
- ホームはメモをアラート表示し、その下に在庫一覧を表示
- メモページはメモカード全体を表示し、メモ追加・削除を行う
- 入庫・出庫ページは操作パネルを表示
- 検索はモーダルで開き、検索語を在庫一覧の絞り込みに反映する

### Web Push通知
- メモページの「通知ON」ボタンから端末ごとに通知を許可
- メモ追加後、Supabase Edge Function（`memo-push`）を呼び出して購読端末へ通知
- PWAとしてホーム画面に追加したiOS/iPadOS 16.4以降、Android Chrome、デスクトップChrome/Edge等で利用可能

### 在庫操作
- **入庫** — 品目を選択（または新規登録）して数量・カテゴリ・保管場所を入力
- **出庫** — 品目を選択して数量を減らす。在庫0未満はバリデーションで禁止
- **在庫一覧** — 品名・カテゴリ・在庫数・保管場所を一覧表示。品名で絞り込み検索、品名順・カテゴリ順の表示ソートが可能

### 編集・削除
- **行クリック編集** — 在庫一覧の行をクリックすると品名・カテゴリ・保管場所をインライン編集（その品目のみ更新）
- **削除モード** — 一覧右上の「削除する」ボタンで各行に削除ボタンを表示。確認ダイアログあり

### 保管場所管理
- 一覧右上の「**場所管理**」ボタンで保管場所管理モーダルを開く
- 登録済みの保管場所を一覧表示し、各場所の在庫件数を確認できる
- 「名前を変更」でその保管場所に紐づく**全在庫に一括反映**してリネーム
- 行クリック編集での保管場所変更は**当該品目のみ**更新（一括反映しない）

### 保管場所入力
- 既存の保管場所をチップボタンとして表示。タップで即入力
- 新しい保管場所は自由入力も可能

### カテゴリ管理
- 台所用品・日用品などのカテゴリを品目ごとに登録できる
- 既存カテゴリはチップボタンとして表示。タップで即入力
- 一覧右上の「**カテゴリ管理**」ボタンでカテゴリ名を一括リネームできる
- 行クリック編集でのカテゴリ変更は**当該品目のみ**更新（一括反映しない）

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
const PUSH_VAPID_PUBLIC_KEY = '...';

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
| category | text | 属性カテゴリ |
| box | text | 保管場所（箱番号） |
| created_at | timestamptz | 作成日時 |

### テーブル: push_subscriptions

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid | 主キー（自動生成） |
| endpoint | text | PushSubscription endpoint（ユニーク） |
| subscription | jsonb | PushSubscription 全体 |
| user_email | text | 購読したユーザーのメール |
| user_agent | text | 購読端末のUser-Agent |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

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

`service-worker.js` の3行目のバージョン番号を上げてアップロードしてください。

```javascript
const CACHE_VERSION = 'zaiko-v14'; // → 'zaiko-v15' に変更
```

---

## Web Push 設定

### 1. VAPID鍵を生成

```bash
node tools/generate-vapid-keys.js
```

### 2. `config.js` に公開鍵を追加

```javascript
const PUSH_VAPID_PUBLIC_KEY = '生成した PUSH_VAPID_PUBLIC_KEY';
```

### 3. Supabase Secrets を設定

```bash
supabase secrets set VAPID_PUBLIC_KEY="生成した VAPID_PUBLIC_KEY"
supabase secrets set VAPID_PRIVATE_KEY="生成した VAPID_PRIVATE_KEY"
supabase secrets set VAPID_SUBJECT="mailto:your-email@example.com"
```

`SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY` はSupabase Edge Functionsの標準環境変数を使います。

### 4. Edge Function をデプロイ

```bash
supabase functions deploy memo-push
```

### 5. DBスキーマを反映

`supabase_rls.sql` の `push_subscriptions` セクションを Supabase SQL Editor で実行してください。

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

### GitHub Actions（自動）

`main` ブランチにプッシュすると、GitHub Actions が自動で Xserver に rsync デプロイします。

必要な GitHub Secrets:

| Secret名 | 内容 |
|---|---|
| `XSERVER_HOST` | Xserver のホスト名 |
| `XSERVER_USER` | SSH ユーザー名 |
| `XSERVER_KEY_B64` | SSH 秘密鍵（Base64エンコード） |
| `XSERVER_REMOTE_PATH` | デプロイ先パス（例: `~/public_html/stock-room/`） |

### 手動デプロイ

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
