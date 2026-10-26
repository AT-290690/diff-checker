const CACHE = 'diff-checker-v3'
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './common.js',
  './diff.js',
  './diff-engine.js',
  './diff-worker.js',
  './main.js',
  './share.js',
  './diff_match_patch.js',
  './lz-string.min.js',
  './manifest.json',
  './assets/favicon.png',
  './assets/images/icon-144.png',
  './assets/images/icon-192.png',
  './assets/images/icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html'))
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  )
})
