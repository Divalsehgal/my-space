Analytics implementation control means making event names and payloads compile-time contracts before they become reporting data.

## Registry (contract)
Attack: Stringly events — components spell event names manually and drift from GTM triggers.
Fix: Define all event names in a single registry and export typed constants.

```js
// ❌ typo creates a dead event
trackInteraction("nav_clik", { label: "About" });

// ✅ registry keeps names canonical
trackInteraction(ANALYTICS_EVENTS.NAV_CLICK, {
  label: "About",
});
```

| **Registry item** | **Purpose** |
|---|---|
| Event name | GTM trigger contract |
| Category map | GA4 grouping |
| Payload type | Component compile-time check |

**Canonical name** — GTM should match the registry value exactly.

**No literals** — component code should not invent event strings.

**Review point** — new analytics behavior starts in the registry.

## Payloads (typing)
Attack: Shape drift — two components send the same event with incompatible payload fields.
Fix: Type each event payload and make `trackInteraction` generic over the event name.

```js
// ❌ payload shape is unchecked
track("social_click", { network: "GitHub" });

// ✅ payload matches the event contract
trackInteraction(ANALYTICS_EVENTS.SOCIAL_CLICK, {
  platform: "GitHub",
  href: "https://github.com/user",
});
```

| **Event** | **Required payload** |
|---|---|
| `nav_click` | `label`, `href`, `location` |
| `social_click` | `platform`, `href` |
| `contact_submit` | `status`, optional `message` |

**Payload type** — make illegal analytics states unrepresentable.

**Optional field** — use it only when reports can handle absence.

**Event category** — derive it centrally, not inside components.

## Integration (components)
Attack: Analytics logic leaks into UI — components build categories, labels, and vendor payloads inline.
Fix: Components call one public helper with event intent and domain payload.

```js
// ❌ component knows reporting internals
dataLayer.push({ event_category: "Social", event_label: "GitHub" });

// ✅ component reports intent
trackInteraction(ANALYTICS_EVENTS.SOCIAL_CLICK, {
  platform: "GitHub",
  href,
});
```

| **Layer** | **Knows** |
|---|---|
| Component | User action and local context |
| Analytics helper | Category and label derivation |
| GTM | Vendor routing |

**Component boundary** — UI should not know GA4 category names.

**Label derivation** — centralize it so dashboards stay consistent.

**One helper** — makes instrumentation easy to audit.

## Gaps (coverage)
Attack: Declared-but-unused events — registry entries exist but no component emits them.
Fix: Track implementation status for each event and remove or wire dead contracts.

```js
// ❌ event exists but never fires
PROJECT_VIEW: "project_view";

// ✅ mount tracker emits the view
useEffect(() => {
  trackInteraction(ANALYTICS_EVENTS.BLOG_VIEW, { title, slug });
}, [title, slug]);
```

| **Event** | **Status** | **Next action** |
|---|---|---|
| `blog_view` | Pending | Client view tracker |
| `page_end_reached` | Pending | Intersection observer |
| `project_view` | Pending | Detail view or remove |

**Dead event** — a registry entry without an emitter creates false confidence.

**View event** — server-rendered pages need a client boundary to fire on mount.

**Once-per-page** — scroll-depth and footer events need de-duplication.

## Critical Chain
Order matters because analytics quality depends on the registry before the dashboard ever sees an event.

    Component writes a raw event string
      -> GTM trigger expects a different spelling
      -> event never reaches GA4
      -> dashboard shows an artificial drop
      -> team adds duplicate instrumentation
      -> reports contain both gaps and double counts
