self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('eventer-cache-v1').then(cache => {
      return cache.addAll([
        '/',
        '/dashboard',
        '/public/css/output.css',
        '/public/js/app.js',
        '/images/logo.png',
        '/images/logo-192.png',
        '/images/logo-512.png'
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
