// RTLH kiosk offline cache: the page and product photos keep working when venue Wi-Fi drops.
const C = 'rtlh-kiosk-v2';
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(C).then((c) => c.addAll(['./', 'index.html', 'Assets/RTLHPlainLogo.jpg']).catch(() => {}))); });
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== C).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.hostname.endsWith('script.google.com') || u.hostname.endsWith('googleusercontent.com')) return;
  const isImg = /\/img\/[pg]\//.test(u.pathname) || /\.(webp|png|jpe?g|woff2?)$/.test(u.pathname) || u.hostname.includes('fonts.g');
  if (isImg) { // photos & fonts: cache first
    e.respondWith(caches.match(r).then((hit) => hit || fetch(r).then((res) => { const cp = res.clone(); caches.open(C).then((c) => c.put(r, cp)); return res; })));
  } else { // page & product list: network first, cache when offline
    e.respondWith(fetch(r).then((res) => { const cp = res.clone(); caches.open(C).then((c) => c.put(r, cp)); return res; }).catch(() => caches.match(r)));
  }
});
