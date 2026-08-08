// Kill-switch service worker.
//
// The app previously shipped a Workbox/next-pwa service worker that precached
// HTML and assets. PWA support has been removed, but browsers that already
// registered the old worker keep serving stale, cached content. Deleting this
// file is not enough: the browser only drops a worker when the script at its
// registered URL tells it to. So this no-op worker takes control, clears every
// cache, and unregisters itself. After one navigation, affected clients are
// fully cleaned up and load fresh content directly from the network.

self.addEventListener("install", () => {
  // Activate immediately instead of waiting for existing clients to close.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Delete all Cache Storage entries left behind by the old worker.
      if (self.caches) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }

      // Take control of any open clients so the next fetch is uncontrolled.
      await self.clients.claim();

      // Unregister this worker so future loads have no service worker at all.
      await self.registration.unregister();

      // Force a reload of controlled pages to bypass the previously served
      // cached HTML.
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        client.navigate(client.url);
      }
    })(),
  );
});
