# Zaiko - 日用品ストック管理アプリ

## Project Overview

Household inventory management web app for a 2-person family. Tracks daily-use item stock with fast in/out operations and real-time multi-device sync.

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3 — no build tools, no npm, no compilation
- **Backend**: Supabase (PostgreSQL via PostgREST REST API)
- **Auth**: Supabase Auth + Google OAuth 2.0
- **PWA**: Service Worker + Web App Manifest
- **Hosting**: Xserver (Japanese shared host), deployed via rsync over SSH

## Key Files

| File | Purpose |
|------|---------|
| `index.html` | Complete SPA — all UI, styles, and logic in one file |
| `login/index.html` | Google OAuth login page with allowlist check |
| `config.js` | Supabase URL, anon key, allowed emails — **git-ignored, never commit** |
| `service-worker.js` | SW caching (cache-first static, network-first Supabase GET) |
| `manifest.json` | PWA metadata |
| `supabase_rls.sql` | RLS policy setup for `stock` table |

## Deployment

No local dev server needed — open `index.html` in a browser (requires `config.js`).

- **CI/CD**: Push to `main` → GitHub Actions runs rsync to Xserver
- **Manual**: SFTP upload to `public_html/stock-room/`
- **VS Code**: `.vscode/sftp.json` with `uploadOnSave`

Required GitHub Secrets: `XSERVER_HOST`, `XSERVER_USER`, `XSERVER_KEY_B64`, `XSERVER_REMOTE_PATH`

## Cache Busting

When deploying changes, increment `CACHE_VERSION` in `service-worker.js` line 3 (e.g., `'zaiko-v17'` → `'zaiko-v18'`). Also update the version label in `index.html` header (`<span>v17</span>`).

## Database Schema

```sql
Table: stock
  id         uuid         PK
  name       text         unique
  qty        integer      >= 0
  category   text         attribute category
  box        text         storage location
  created_at timestamptz

Table: stock_reservations
  id         uuid         PK
  kind       text         'in' for 入庫予定, 'out' for 出庫希望
  item_id    uuid         target stock item id
  item_name  text         item name snapshot
  qty        integer      > 0
  user_email text         creator email
  created_at timestamptz
```

## Code Patterns

**API layer** (in `index.html`):
```javascript
const db = {
  list:        ()           => api('GET',    'stock?select=*&order=name.asc'),
  insert:      (row)        => api('POST',   'stock', row),
  update:      (id, patch)  => api('PATCH',  `stock?id=eq.${id}`, patch),
  delete:      (id)         => api('DELETE', `stock?id=eq.${id}`),
  updateByBox: (box, patch) => api('PATCH',  `stock?box=eq.${encodeURIComponent(box)}`, patch),
  updateByCategory: (category, patch) => api('PATCH', `stock?category=eq.${encodeURIComponent(category)}`, patch),
};

const reservationDb = {
  list:   ()    => api('GET',    'stock_reservations?select=*&order=created_at.desc'),
  insert: (row) => api('POST',   'stock_reservations', row),
  delete: (id)  => api('DELETE', `stock_reservations?id=eq.${id}`),
};
```

**State**: Global `items[]`, `memos[]`, `reservations[]`, `currentTab`, `currentPage`, `reservationBusyId`, `editingId`, `deleteMode`, `boxEditingName`, `categoryEditingName`, `groupView`, `collapsedBoxes` — direct DOM manipulation, no framework.

**Page navigation**: Bottom navigation switches `.page-view` sections with `navigatePage(page)`. Home shows `#home-memo-list` as a memo/reservation alert feed plus the stock list. The memo page shows the full memo card and reservation cards. The in/out page shows the operation card. Search opens `#search-overlay`; applying it writes to `input#search`, returns to home, and calls `renderTable()`.

**Web Push notifications**: `PUSH_VAPID_PUBLIC_KEY` lives in ignored `config.js`. The memo page's `.push-enable-btn` calls `enablePushNotifications()`, stores browser subscriptions in `push_subscriptions`, and `addMemo()` / reservation creation call the `memo-push` Edge Function after a successful insert. Reservation pushes pass a custom `title` and `tag`; existing memo pushes still work without them. `service-worker.js` handles `push` and `notificationclick`.

**Storage location management**: `box` field acts as a grouping category. Per-item edit updates only that item's box. The "場所管理" modal (`openBoxManager`) handles bulk renames across all items via `db.updateByBox`.

**Category management**: `category` is an optional per-item attribute such as 台所用品 or 日用品. Per-item edit updates only that item's category. The "カテゴリ管理" modal (`openCategoryManager`) handles bulk renames across all items via `db.updateByCategory`. The list sort selector supports name order and category order, with empty categories last.

**Stock reservations**: "出庫希望" and "入庫予定" are reservations, not stock movements. Creating one inserts a row in `stock_reservations` and sends a push notification without changing `stock.qty`. Home row expansion includes reservation quantity plus "出庫希望" / "入庫予定"; the in/out page has separate reservation buttons beside normal stock movement buttons. `executeReservation()` applies the stock update and deletes the reservation; out reservations re-check insufficient stock at execution time. `cancelReservation()` only deletes the reservation row.

**Group view**: "グループ表示" button in the 在庫一覧 header toggles `groupView` mode. When active, `renderTable` dispatches to `renderGroupView(filtered)`, which groups items by `box`, renders collapsible section headers (click to toggle), and sorts boxes alphabetically with empty-box items last. `groupView` and `deleteMode` are mutually exclusive. `collapsedBoxes` is a `Set<string>` of currently collapsed box names; it clears when group view is turned off.

**Auto-refresh**: Every 60 seconds when page is visible; pauses in background.

## Conventions

- UI text is in Japanese
- CSS uses custom properties: `--accent`, `--danger`, `--text`, `--muted`, etc.
- Dark mode via `@media (prefers-color-scheme: dark)`
- Mobile breakpoint: 720px
- Error messages auto-clear after 5 seconds
- No automated tests — manual browser testing only
