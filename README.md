# ストック管理アプリ セットアップ手順

## ファイル構成

```
stock/
├── index.html      ← アプリ本体
├── .htaccess       ← Basic認証設定
└── .htpasswd       ← パスワードファイル（手順に従い生成）
```

---

## Step 1: Supabase側の設定（RLS）

1. Supabase管理画面 → SQL Editor を開く
2. `supabase_rls.sql` の内容をコピーして実行する
3. エラーなく完了すればOK

---

## Step 2: .htpasswd ファイルの生成

Basic認証のパスワードファイルを生成します。

### 方法A: オンラインツールで生成（簡単）
1. https://www.web2generators.com/apache-tools/htpasswd-generator を開く
2. Username と Password を入力して Generate
3. 表示された1行テキストをコピーして `.htpasswd` という名前のファイルに保存

### 方法B: ターミナルで生成（Mac/Linux）
```bash
htpasswd -c .htpasswd ユーザー名
# パスワードを2回入力
```

---

## Step 3: .htaccess の編集

`.htaccess` の以下の行を実際のサーバーパスに変更してください：

```
AuthUserFile /home/YOUR_USERNAME/stock/.htpasswd
```

---

## Step 4: アップロード

FTPクライアント（FileZilla等）で以下の場所にアップロード：

```
アップロード先: public_html/stock/
```

アップロードするファイル：
- index.html
- .htaccess
- .htpasswd（Step2で生成したもの）

※ .htaccess や .htpasswd はドットから始まるファイルです。
  FTPクライアントの「隠しファイルを表示」を有効にしてアップロードしてください。

---

## Step 5: 動作確認

ブラウザで以下のURLを開く：
```
https://ドメイン/stock/
```

1. Basic認証のダイアログが表示される → ユーザー名・パスワードを入力
2. アプリが表示される
3. 右上の「同期済み」が表示されればSupabase接続OK

---

## 2台での共有

同じURLをスマホやPCで開くだけです。
どちらの端末から操作しても、リアルタイムで同じデータが更新されます。

---

## トラブルシューティング

| 症状 | 原因・対処 |
|------|-----------|
| 「接続エラー」と表示 | Supabase RLS設定を確認（Step1） |
| Basic認証が出ない | .htaccess が反映されていない |
| 401 Unauthorized | .htpasswdのパスが正しいか確認 |
| データが表示されない | Supabase SQL Editorで `select * from stock;` を実行して確認 |
