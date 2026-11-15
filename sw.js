const CACHE = 'outpost-zero-v12';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './upgrade.css',
    './upgrade2.css',
    './polish.css',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/logo.svg',
    './js/data.js',
    './js/urdu.js',
    './js/music.js',
    './js/core.js',
    './js/game.js',
    './js/cinematic.js',
    './js/extras.js',
    './js/app.js',
    './js/upgrade.js',
    './js/upgrade2.js',
    './js/voice.js',
    './js/polish.js',
    './js/robo7.js'
];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;
    if (e.request.url.includes('api.nasa.gov')) return;
    e.respondWith(
        caches.match(e.request).then(cached =>
            cached || fetch(e.request).then(res => {
                const clone = res.clone();
                caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {});
                return res;
            }).catch(() => cached)
        )
    );
});