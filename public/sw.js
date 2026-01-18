const FONT_CACHE = 'vibetype-fonts-v1'

// Font domains to cache
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com']

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  if (!FONT_HOSTS.includes(url.hostname)) {
    return // Let browser handle non-font requests normally
  }

  event.respondWith(
    caches.open(FONT_CACHE).then(async (cache) => {
      const cached = await cache.match(event.request)
      if (cached) {
        return cached
      }

      const response = await fetch(event.request)

      // Only cache successful responses
      if (response.ok) {
        cache.put(event.request, response.clone())
      }

      return response
    })
  )
})
