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

When deploying changes, increment `CACHE_VERSION` in `service-worker.js` line 3 (e.g., `'zaiko-v7'` → `'zaiko-v8'`).

## Database Schema

```sql
Table: stock
  id         uuid         PK
  name       text         unique
  qty        integer      >= 0
  box        text         storage location
  created_at timestamptz
```

## Code Patterns

**API layer** (in `index.html`):
```javascript
const db = {
  list:   ()         => api('GET',    'stock?select=*&order=name.asc'),
  insert: (row)      => api('POST',   'stock', row),
  update: (id, patch)=> api('PATCH',  `stock?id=eq.${id}`, patch),
  delete: (id)       => api('DELETE', `stock?id=eq.${id}`),
};
```

**State**: Global `items[]`, `currentTab`, `editingId`, `deleteMode` — direct DOM manipulation, no framework.

**Auto-refresh**: Every 60 seconds when page is visible; pauses in background.

## Conventions

- UI text is in Japanese
- CSS uses custom properties: `--accent`, `--danger`, `--text`, `--muted`, etc.
- Dark mode via `@media (prefers-color-scheme: dark)`
- Mobile breakpoint: 720px
- Error messages auto-clear after 5 seconds
- No automated tests — manual browser testing only
