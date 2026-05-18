PWA implementation means controlling the browser-side network proxy so offline support does not ship stale code against fresh data.

## Registration (scope)
Attack: Accidental takeover — a service worker controls routes or environments where cache behavior was never validated.
Fix: Register only in production and keep the worker scope aligned to the app shell.

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
| Path scope | Controls intercepted URLs |

**Worker scope** — registration URL determines the controlled path tree.

**Dev bypass** — stale local workers waste debugging time.

**HTTPS** — production service workers require secure contexts.

## Runtime Cache (strategy)
Attack: Stale data replay — API responses remain cached after the server contract or user-specific state changes.
Fix: Choose cache strategies by resource class.

```js
// ❌ one strategy for everything
workbox.routing.registerRoute(/.*/, new CacheFirst());

// ✅ assets and API use different policies
registerRoute(/\.(js|css|png)$/, new CacheFirst());
registerRoute(/\/api\//, new NetworkFirst({ networkTimeoutSeconds: 3 }));
```

| **Resource** | **Strategy** | **Risk** |
|---|---|---|
| Static asset | Cache first | Bad revisioning |
| API response | Network first | Offline fallback complexity |
| HTML shell | Stale while revalidate | Version skew |

**Asset hash** — immutable caching only works when filenames change.

**API cache** — avoid personalized caches without strict keys and expiry.

**Fallback response** — offline UX should be explicit.

## Updates (activation)
Attack: Split-brain release — a new shell runs with an old worker or old assets with new HTML.
Fix: Define activation behavior and version assets.

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

**Immediate activation** — useful for small apps, risky for long sessions.

**Version skew** — HTML, JS, CSS, and worker must agree on asset names.

**Rollback** — bad cache policy can survive the deploy that introduced it.

## Manifest (installability)
Attack: Broken install contract — the app installs with missing icons, wrong display mode, or incorrect theme metadata.
Fix: Keep manifest metadata complete and verify it in browser tooling.

```js
// ❌ install metadata is incomplete
const badManifest = { name: "Portfolio" };

// ✅ install metadata defines app behavior
const manifest = {
  name: "Portfolio",
  display: "standalone",
  theme_color: "#111111",
};
```

| **Field** | **Prevents** |
|---|---|
| `display` | Browser chrome after install |
| `theme_color` | Mismatched mobile system UI |
| `icons` | Missing launcher assets |

**Standalone mode** — installed apps should not feel like bookmarked tabs.

**Icon sizes** — provide the platform-required sizes.

**Manifest link** — expose it from app metadata for discovery.

## Critical Chain
Order matters because a service worker is a network proxy, and proxy mistakes survive across reloads and deploys.

    Worker registers in an unvalidated environment
      -> broad route caches API and shell responses together
      -> deployment ships incompatible asset revisions
      -> old worker serves stale files to a new page
      -> UI executes against a changed server contract
      -> users see failures that clearing cache appears to fix
