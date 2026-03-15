// ===== SERVICE WORKER =====
// バージョンを上げるとキャッシュが更新されます
const CACHE_VERSION = 'zaiko-v7';

const PRECACHE_ASSETS = [
  '/stock-room/',
  '/stock-room/index.html',
  '/stock-room/config.js',
  '/stock-room/zaiko_header_logo.svg',
  '/stock-room/favicon.ico',
  '/stock-room/icons/icon-180.png',
  '/stock-room/icons/icon-512.png',
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
