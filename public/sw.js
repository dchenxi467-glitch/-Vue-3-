/* 缺了啥? Service Worker — 离线缓存与 app shell 加速
 * 缓存策略：app shell 与构建产物 cache-first（命中即返回），导航请求 network-first fallback to cache
 * 第三方 CDN（字体等）pass-through，不缓存避免版本问题
 */
const CACHE = 'quelesha-shell-v1'
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
]

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  // 第三方（CDN / 字体 / api）放行不缓存
  if (url.origin !== self.location.origin) return

  // 导航请求：network-first（拿到最新），失败回退到缓存
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((r) => {
          const copy = r.clone()
          caches.open(CACHE).then((c) => c.put(req, copy))
          return r
        })
        .catch(() => caches.match('./index.html')),
    )
    return
  }

  // 同源静态资源：cache-first + 后台更新
  e.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((r) => {
          if (r.ok) {
            const copy = r.clone()
            caches.open(CACHE).then((c) => c.put(req, copy))
          }
          return r
        })
        .catch(() => cached)
      return cached || fetchPromise
    }),
  )
})