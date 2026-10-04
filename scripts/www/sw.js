// 健身饮食学习日历 — Service Worker（离线缓存）
// 仅缓存本应用自身的页面与脚本；运行时 GET 请求走 cache-first，未命中再联网并回填缓存。
const CACHE = 'fdsc-pwa-v1';
const APP_SHELL = [
  './',
  './sw.js',
  './fitness-diet-study-calendar.html'
];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(APP_SHELL).catch(function () { /* 任一缺失不阻塞安装，运行时再补 */ });
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(req).then(function (cached) {
        if (cached) return cached;
        return fetch(req).then(function (resp) {
          if (resp && resp.ok && resp.type === 'basic') {
            cache.put(req, resp.clone());
          }
          return resp;
        }).catch(function () {
          if (req.mode === 'navigate') {
            return cache.match('./fitness-diet-study-calendar.html')
              .then(function (h) { return h || cache.match('./'); });
          }
          throw new Error('offline');
        });
      });
    })
  );
});
