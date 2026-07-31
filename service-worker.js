// ===== SERVICE WORKER =====
// バージョンを上げるとキャッシュが更新されます
const CACHE_VERSION = 'zaiko-v19';

const PRECACHE_ASSETS = [
  '/stock-room/',
  '/stock-room/index.html',
  '/stock-room/zaiko_header_logo.svg',
  '/stock-room/favicon.ico',
  '/stock-room/icons/icon-180.png',
  '/stock-room/icons/icon-192.png',
  '/stock-room/icons/icon-512.png',
  '/stock-room/images/home.svg',
  '/stock-room/images/memo.svg',
  '/stock-room/images/inout.svg',
  '/stock-room/images/search.svg',
];

// ===== インストール: 静的ファイルをキャッシュ（個別に試みて失敗しても続行）=====
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache =>
      Promise.allSettled(
        PRECACHE_ASSETS.map(url => cache.add(url).catch(() => {}))
      )
    )
  );
  self.skipWaiting();
});

// ===== アクティベート: 古いキャッシュを削除 =====
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ===== フェッチ: キャッシュ優先（静的ファイル）/ ネットワーク優先（API）=====
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Keep runtime config fresh across installed PWAs while preserving an offline fallback.
  if (url.pathname === '/stock-room/config.js') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Supabase: GETのみネットワーク優先→失敗時キャッシュフォールバック、書き込みはスルー
  if (url.hostname.includes('supabase.co')) {
    if (event.request.method !== 'GET') return;
    event.respondWith(
      fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // 静的ファイル: キャッシュ優先、なければネットワーク取得してキャッシュ
  // http/https以外（chrome-extensionなど）はスキップ
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});

// ===== PUSH: メモ・予約通知 =====
self.addEventListener('push', event => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_) {
    data = { body: event.data?.text() || '' };
  }

  const title = data.title || '通知';
  const options = {
    body: data.body || '通知があります。',
    icon: '/stock-room/icons/icon-192.png',
    badge: '/stock-room/icons/icon-180.png',
    tag: data.tag || 'zaiko-memo',
    data: {
      url: data.url || '/stock-room/',
      memo_id: data.memo_id || null
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/stock-room/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        if (clientUrl.pathname.startsWith('/stock-room/') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
