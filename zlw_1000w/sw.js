// Auto-generated — do not edit
const CACHE = 'dash-1aede41f5c-7f6197bf48';
const CACHE_PREFIX = 'dash-1aede41f5c-';

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const url = new URL('./index.html', self.location.href);
    url.searchParams.set('_fresh', CACHE);
    const response = await fetch(url.href, {cache: 'no-store'});
    if (!response.ok) throw new Error('failed to cache dashboard shell');
    await cache.put('./index.html', response);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k === 'dash-v1' ||
        (k.startsWith(CACHE_PREFIX) && k !== CACHE)).map(k => caches.delete(k))
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
      if (!r.ok) return r;
      return putHashed(req, r.clone()).then(() => r, () => r);
    });
  });
}

function matchNav(req) {
  return caches.match(req).then(r => r || caches.match('./index.html'));
}

async function networkFirstNavigation(req) {
  try {
    const url = new URL(req.url);
    url.searchParams.set('_fresh', Date.now().toString());
    const response = await fetch(url.href, {
      cache: 'no-store',
      credentials: 'same-origin',
      redirect: 'follow',
    });
    if (response.ok) {
      try {
        const cache = await caches.open(CACHE);
        await cache.put(req, response.clone());
      } catch (error) {}
    }
    return response;
  } catch (error) {
    const cached = await matchNav(req);
    return cached || Response.error();
  }
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  // The tiny manifest is always fresh. Versioned page bundles are immutable
  // and use the normal content-hash cache below.
  if (url.pathname.endsWith('/intraday/manifest.json')) {
    e.respondWith(fetch(e.request, {cache: 'no-store'}));
  } else if (url.pathname.includes('/charts/')) {
    // Detail charts can total hundreds of MB. Let the browser manage its own
    // HTTP cache instead of retaining every visited chart in Cache Storage.
    e.respondWith(fetch(e.request));
  } else if (url.searchParams.has('v')) {
    e.respondWith(cacheFirst(e.request));
  } else if (url.pathname.includes('/intraday/')) {
    e.respondWith(fetch(e.request, {cache: 'no-store'}));
  } else if (e.request.mode === 'navigate') {
    e.respondWith(networkFirstNavigation(e.request));
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
