const CACHE = 'block-empire-mobile-v3';
const SHELL = [
  './index.html', './style.css?v=14', './mobile.css?v=2', './app.mjs?v=14',
  './install.mjs', './mobile-ui.mjs', './manifest.webmanifest', './icon.svg',
  './adventures.mjs', './building-identity.mjs', './building-models.mjs',
  './camera.mjs', './city.mjs', './exchange-ui.mjs', './exchange.mjs',
  './game.mjs', './city-missions.mjs', './map-layout.mjs', './property-card.mjs', './rail-effects.mjs',
  './seasons.mjs', './trivia-extra.mjs', './warfare.mjs'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('block-empire-mobile-') && key !== CACHE).map(key => caches.delete(key)))));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith('/play/')) return;
  const asset = url.pathname.split('/').pop();
  if (!SHELL.some(entry => entry.slice(2).split('?')[0] === asset)) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, copy)));
    }
    return response;
  }).catch(async () => {
    const cached = await caches.match(event.request, {ignoreSearch: true});
    return cached || Response.error();
  }));
});