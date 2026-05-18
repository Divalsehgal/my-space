PWA cache correctness means controlling which responses can outlive the network so users do not run stale code against fresh data.

## Registration (scope)
Attack: Accidental takeover — a service worker controls routes or environments where cache behavior was never validated.
Fix: register only in production and keep the service worker scope aligned to the app shell.

```js
// ❌ worker runs everywhere
navigator.serviceWorker.register("/sw.js");

// ✅ production-only registration
if (process.env.NODE_ENV === "production") {
  navigator.serviceWorker.register("/sw.js");
}
```

| **Scope** | **Notes** |
|---|---|
| Local dev | Prefer no worker or explicit unregister |
| Production | Register after deploy validation |
| Path scope | Controls which URLs the worker can intercept |

**Worker scope** — the registration URL determines the controlled path tree.

**Dev bypass** — stale local workers waste debugging time.

**HTTPS** — production service workers require secure contexts.

## Runtime Cache (strategy)
Attack: Stale data replay — API responses stay cached after the server contract or user-specific state changes.
Fix: choose cache strategies by resource class, not by convenience.

```js
// ❌ one strategy for everything
workbox.routing.registerRoute(/.*/, new CacheFirst());

// ✅ assets and API use different policies
registerRoute(/\.(js|css|png)$/, new CacheFirst());
registerRoute(/\/api\//, new NetworkFirst({ networkTimeoutSeconds: 3 }));
```

| **Resource** | **Strategy** | **Risk** |
|---|---|---|
| Static asset | Cache first | Old asset after bad revisioning |
| API response | Network first | Offline fallback complexity |
| HTML shell | Stale while revalidate | Version skew |

**Asset hash** — immutable caching only works when filenames change on content change.

**API cache** — never cache personalized data without a strict key and expiry model.

**Fallback response** — offline UX must be explicit, not a random old payload.

## Updates (activation)
Attack: Split-brain release — the browser serves a new shell with an old worker or old assets with new HTML.
Fix: define activation behavior and version assets so old and new clients do not mix incompatible files.

```js
// ❌ update waits behind closed tabs
self.addEventListener("install", () => {});

// ✅ activate the deployed worker immediately
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
```

| **Step** | **Prevents** |
|---|---|
| `skipWaiting` | Long-lived old worker |
| `clients.claim` | Uncontrolled first load |
| Revisioned assets | HTML and JS mismatch |

**Immediate activation** — useful for small apps, risky for long-running sessions.

**Version skew** — HTML, JS, CSS, and worker must agree on asset names.

**Rollback** — bad cache policy can survive the deploy that introduced it.

## Manifest (installability)
Attack: Broken install contract — the app installs but launches with missing icons, wrong display mode, or incorrect theme metadata.
Fix: keep manifest metadata complete and verify it in browser tooling before release.

```js
// ❌ install metadata is incomplete
const badManifest = { name: "Portfolio" };

// ✅ install metadata defines app behavior
const manifest = {
  "name": "Portfolio",
  "display": "standalone",
  "theme_color": "#111111",
  "icons": [{ "src": "/icons/icon-192x192.png", "sizes": "192x192" }]
};
```

| **Field** | **Prevents** |
|---|---|
| `display` | Browser chrome after install |
| `theme_color` | Mismatched mobile system UI |
| `icons` | Low-quality or missing launcher icon |

**Standalone mode** — installed apps should not feel like bookmarked tabs.

**Icon sizes** — provide at least the platform-required sizes.

**Manifest link** — expose it from app metadata so browsers can discover it.

## Critical Chain
Order matters because a service worker is a network proxy, and proxy mistakes survive across reloads and deploys.

    Worker registers in an unvalidated environment
      -> broad route caches API and shell responses together
      -> deployment ships incompatible asset revisions
      -> old worker serves stale files to a new page
      -> UI executes against a changed server contract
      -> users see failures that clearing cache appears to fix
