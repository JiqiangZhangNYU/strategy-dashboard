// Auto-generated — do not edit
const CACHE = 'dash-v1';
const NAV_TIMEOUT_MS = 3000;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./index.html'])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// Store a response and evict cached copies of the same path with a stale ?v= hash,
// so daily data refreshes don't accumulate dead entries.
function putHashed(req, resp) {
  return caches.open(CACHE).then(c => {
    const path = new URL(req.url).pathname;
    return c.keys().then(keys => Promise.all(
      keys.filter(k => k.url !== req.url && new URL(k.url).pathname === path)
          .map(k => c.delete(k))
    )).then(() => c.put(req, resp));
  });
}

// ?v= URLs are content-hashed: a cache hit is always current, never refetch.
function cacheFirst(req) {
  return caches.match(req).then(cached => {
    if (cached) return cached;
    return fetch(req).then(r => {
      if (r.ok) putHashed(req, r.clone());
      return r;
    });
  });
}

function matchNav(req) {
  return caches.match(req).then(r => r || caches.match('./index.html'));
}

// Network-first; if the network is slower than NAV_TIMEOUT_MS and a cached copy
// exists, serve the cache while the fetch keeps updating it in the background.
function networkFirstWithTimeout(req) {
  return new Promise(resolve => {
    let settled = false;
    const timer = setTimeout(() => {
      matchNav(req).then(cached => {
        if (cached && !settled) { settled = true; resolve(cached); }
      });
    }, NAV_TIMEOUT_MS);
    fetch(req).then(r => {
      clearTimeout(timer);
      if (r.ok) {
        const clone = r.clone();
        caches.open(CACHE).then(c => c.put(req, clone));
      }
      if (!settled) { settled = true; resolve(r); }
    }).catch(() => {
      clearTimeout(timer);
      matchNav(req).then(cached => {
        if (!settled) { settled = true; resolve(cached || Response.error()); }
      });
    });
  });
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (url.searchParams.has('v')) {
    e.respondWith(cacheFirst(e.request));
  } else if (e.request.mode === 'navigate') {
    e.respondWith(networkFirstWithTimeout(e.request));
  } else {
    e.respondWith(
      fetch(e.request).then(r => {
        if (r.ok) {
          const clone = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return r;
      }).catch(() => caches.match(e.request))
    );
  }
});
