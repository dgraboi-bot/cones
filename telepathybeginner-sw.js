const CACHE_NAME = "telepathybeginner-v20260626j";
const APP_VERSION = "20260626j";
const APP_ASSETS = [
  `./telepathybeginner.html?v=${APP_VERSION}`,
  `./telepathybeginner.css?v=${APP_VERSION}`,
  `./telepathybeginner.js?v=${APP_VERSION}`,
  `./telepathybeginner.webmanifest?v=${APP_VERSION}`,
  `./vendor/leaflet/leaflet.css?v=${APP_VERSION}`,
  `./vendor/leaflet/leaflet.js?v=${APP_VERSION}`,
  `./telepathybeginner-email-test.html?v=${APP_VERSION}`,
  `./telepathybeginner-email-test.js?v=${APP_VERSION}`,
  `./globe/index.html?v=${APP_VERSION}`,
  `./globe/globe.css?v=${APP_VERSION}`,
  `./globe/globe-config.js?v=${APP_VERSION}`,
  `./globe/globe.js?v=${APP_VERSION}`,
  `./globe/globe-data.js?v=${APP_VERSION}`,
  `./globe/globe-ui.js?v=${APP_VERSION}`,
  "./tb-test-icon-1.png",
  "./tb-test-icon-2.png",
  "./tb-test-icon-3.png",
  "./tb-test-icon-4.png",
  "./BeginnerUserManual.html",
  "./BeginnerUserManual.html?v=20260503a",
  "./minds-connected-uncropped.png",
  "./rewire.png",
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

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_) {
    payload = {
      title: "ESP GYM message",
      body: event.data ? event.data.text() : ""
    };
  }

  const title = String(payload?.title || "ESP GYM message").trim() || "ESP GYM message";
  const body = String(payload?.body || "").trim();
  const url = String(payload?.url || `./telepathybeginner.html?v=${APP_VERSION}`).trim() || `./telepathybeginner.html?v=${APP_VERSION}`;
  const tag = String(payload?.tag || "esp-gym-message").trim() || "esp-gym-message";

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true
      });

      const runtimeClientOpen = clientList.some((client) => {
        try {
          const clientUrl = new URL(client.url);
          const path = clientUrl.pathname.toLowerCase();
          return path.endsWith("/sender.html") || path.endsWith("/receiver.html");
        } catch (_) {
          return false;
        }
      });

      if (runtimeClientOpen) {
        return;
      }

      await self.registration.showNotification(title, {
        body,
        tag,
        renotify: true,
        icon: `./tb-icon-192.png?v=${APP_VERSION}`,
        badge: `./tb-icon-192.png?v=${APP_VERSION}`,
        data: {
          url,
          payload
        }
      });
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = String(event.notification?.data?.url || `./telepathybeginner.html?v=${APP_VERSION}`).trim() || `./telepathybeginner.html?v=${APP_VERSION}`;

  event.waitUntil((async () => {
    const clientList = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true
    });

    for (const client of clientList) {
      try {
        const clientUrl = new URL(client.url);
        const target = new URL(targetUrl, self.location.origin);
        if (clientUrl.origin === target.origin) {
          if ("navigate" in client) {
            await client.navigate(target.href);
          }
          await client.focus();
          return;
        }
      } catch (_) {
        // Ignore malformed client URLs and continue.
      }
    }

    await self.clients.openWindow(targetUrl);
  })());
});






























