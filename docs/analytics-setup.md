Analytics setup means controlling the event pipeline from component intent to reporting output without coupling product code to vendor dashboards.

## Routing (gtm)
Attack: Direct vendor coupling — components send events directly to GA4, so tracking changes require code deploys.
Fix: Push normalized events to `dataLayer` and let GTM route them to GA4.

```js
// ❌ component talks to GA4 directly
gtag("event", "nav_click", { event_label: "About" });

// ✅ component emits a vendor-neutral event
window.dataLayer.push({
  event: "nav_click",
  event_label: "About",
});
```

| **Layer** | **Responsibility** |
|---|---|
| Component | Emits intent |
| Data layer | Carries normalized payload |
| GTM | Routes and transforms |
| GA4 | Reports events |

**Data layer** — treat it as the contract between code and tag management.

**GTM trigger** — match on event name, not DOM selectors.

**GA4 tag** — receive already-normalized parameters.

## Snippets (bootstrap)
Attack: Partial installation — GTM loads in normal browsers but fails in no-script paths or invalid environments.
Fix: Install both GTM snippets and guard the container ID.

```js
// ❌ unvalidated ID renders broken tracking
const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
loadGtm(gtmId);

// ✅ validate the public container ID
if (gtmId?.startsWith("GTM-")) {
  loadGtm(gtmId);
}
```

| **Snippet** | **Location** | **Purpose** |
|---|---|---|
| Script | `<head>` | Loads GTM container |
| Noscript iframe | `<body>` | No-JS fallback |
| Env guard | App code | Prevents malformed IDs |

**Container ID** — public by design, but still validate shape.

**No-script path** — include it for measurement parity.

**Root layout** — install the container once at the app boundary.

## Modes (duplication)
Attack: Double counting — direct GA4 and GTM both emit page views or events.
Fix: Choose one analytics mode and remove the other bootstrap path.

```js
// ❌ both paths can count the same event
loadGtag(process.env.NEXT_PUBLIC_GA_ID);
loadGtm(process.env.NEXT_PUBLIC_GTM_ID);

// ✅ GTM owns analytics routing
loadGtm(process.env.NEXT_PUBLIC_GTM_ID);
```

| **Mode** | **Redeploy for tracking changes?** | **Risk** |
|---|---|---|
| GTM-only | No | Dashboard complexity |
| Direct GA4 | Yes | Vendor coupling |
| Both | Yes | Duplicate events |

**Single mode** — one owner should emit analytics.

**Page view** — verify it once in GA4 DebugView.

**Migration** — remove legacy `gtag` only after GTM is verified.

## Dimensions (reports)
Attack: Unqueryable events — events arrive in GA4 but useful fields are missing from reports.
Fix: Register custom dimensions for payload fields that need filtering or analysis.

```js
// ❌ event has no filterable context
track("project_click");

// ✅ payload carries report dimensions
track("project_click", {
  projectName: "Portfolio",
  linkType: "repo",
});
```

| **Parameter** | **Report use** |
|---|---|
| `event_category` | High-level grouping |
| `event_label` | Human-readable action |
| `location` | UI placement analysis |
| `linkType` | Destination comparison |

**Custom dimension** — create it before relying on the report.

**Parameter name** — keep it stable; dashboards depend on it.

**DebugView** — verify the event before waiting for standard reports.

## Critical Chain
Order matters because analytics is only trustworthy when one pipeline owns event naming, routing, and reporting fields.

    Component sends direct GA4 events
      -> GTM also emits matching events
      -> GA4 records duplicate page views
      -> reports overstate engagement
      -> product decisions optimize against bad data
      -> future tracking work loses credibility
