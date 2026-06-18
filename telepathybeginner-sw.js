const CACHE_NAME = "telepathybeginner-v20260618ba";
const APP_VERSION = "20260618ba";
const APP_ASSETS = [
  `./telepathybeginner.html?v=${APP_VERSION}`,
  `./telepathybeginner.css?v=${APP_VERSION}`,
  `./telepathybeginner.js?v=${APP_VERSION}`,
  `./telepathybeginner.webmanifest?v=${APP_VERSION}`,
  `./telepathybeginner-email-test.html?v=${APP_VERSION}`,
  `./telepathybeginner-email-test.js?v=${APP_VERSION}`,
  "./tb-test-icon-1.png",
  "./tb-test-icon-2.png",
  "./tb-test-icon-3.png",
  "./tb-test-icon-4.png",
  "./BeginnerUserManual.html",
  "./BeginnerUserManual.html?v=20260503a",
  "./minds-connected-uncropped.png",
  "./RV1.png",
  `./tb-icon-192.png?v=${APP_VERSION}`,
  `./tb-icon-512.png?v=${APP_VERSION}`
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          const cachedNavigation = await caches.match(event.request);
          if (cachedNavigation) {
            return cachedNavigation;
          }
          return caches.match(`./telepathybeginner.html?v=${APP_VERSION}`);
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });

        return response;
      });
    })
  );
});




























