self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('eventer-cache-v1').then(cache => {
      return cache.addAll([
        '/',
        '/dashboard',
        '/public/css/output.css',
        '/public/js/app.js',
        '/public/images/icon.webp',
        '/public/images/logo-t.webp',
        '/public/images/logo.webp'
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
