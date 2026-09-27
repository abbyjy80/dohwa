const CACHE = 'dohwa-v5';
const SHELL = ['./', 'index.html', 'support.js', 'manifest.webmanifest',
  '_ds/classical-02ee6020-9814-4570-a364-ee00e6c45dfd/styles.css',
  '_ds/classical-02ee6020-9814-4570-a364-ee00e6c45dfd/_ds_bundle.js',
  'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'api.github.com') return; // GitHub 저장은 항상 네트워크로
  // 고지서 데이터와 페이지: 네트워크 우선 (항상 최신), 오프라인이면 캐시
  if (req.mode === 'navigate' || url.pathname.includes('/uploads/')) {
    e.respondWith(fetch(req).then(r => {
      if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
      return r;
    }).catch(() => caches.match(req).then(m => m || (req.mode === 'navigate' ? caches.match('index.html') : new Response('', { status: 404 })))));
    return;
  }
  // 그 외(스타일, 글꼴, 아이콘, 라이브러리): 캐시 우선 + 백그라운드 갱신
  e.respondWith(caches.match(req).then(m => {
    const net = fetch(req).then(r => {
      if (r && (r.ok || r.type === 'opaque')) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
      return r;
    }).catch(() => m);
    return m || net;
  }));
});
