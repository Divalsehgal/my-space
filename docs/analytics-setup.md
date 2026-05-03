# 📊 Analytics Architecture — GA4 + GTM

> A production-level guide for understanding, implementing, and scaling analytics on this portfolio.

---

## Table of Contents

1. [Why Do We Even Do This?](#1-why-do-we-even-do-this)
2. [What is GA4 and Why We Use It](#2-what-is-ga4-and-why-we-use-it)
3. [What is GTM and Why We Use It](#3-what-is-gtm-and-why-we-use-it)
4. [How GA4 + GTM Work Together](#4-how-ga4--gtm-work-together)
5. [The GTM Script — What GTM Asks You to Add](#5-the-gtm-script--what-gtm-asks-you-to-add)
6. [The Single Source of Truth — Our Event Registry](#6-the-single-source-of-truth--our-event-registry)
7. [Data Flow: Click → Dashboard](#7-data-flow-click--dashboard)
8. [What Is Currently Wired Up](#8-what-is-currently-wired-up)
9. [What Is Pending (End-to-End)](#9-what-is-pending-end-to-end)
10. [GTM Dashboard — What to Configure](#10-gtm-dashboard--what-to-configure)
11. [GA4 Dashboard — What to Set Up](#11-ga4-dashboard--what-to-set-up)
12. [How to Scale This](#12-how-to-scale-this)
13. [Adding a New Event — The Full Workflow](#13-adding-a-new-event--the-full-workflow)
14. [Environment Variables](#14-environment-variables)

---

## 1. Why Do We Even Do This?

Without analytics, you are flying blind. You don't know:

- How many people visit your portfolio and which sections they actually read.
- Whether visitors click your resume or just scroll past it.
- Which projects get the most attention.
- Whether the contact form converts or frustrates users.
- Where people drop off before reaching the Contact section.

Analytics answers these questions with real data. For a portfolio specifically:

- It validates your **UX decisions** — did people engage with the new Hero section?
- It shows **employer/recruiter behavior** — which project did they click after visiting your site?
- It becomes a **feedback loop** for every redesign or content update.

---

## 2. What is GA4 and Why We Use It

**Google Analytics 4 (GA4)** is Google's current analytics platform.

### Key Concepts

- **Event-based model**: Everything is an event. Page views, clicks, scrolls, form submits — all treated uniformly. This is more powerful than the older session-based model.
- **Parameters on events**: Every event can carry custom data (`event_label`, `platform`, `location`, etc.) — enabling precise, filterable reports.
- **Free tier**: 10 million events/month for free — more than a portfolio will ever use.
- **DebugView**: Real-time event viewer to test tracking before going live.
- **Explorations**: Custom funnel and path analysis reports.

### Why GA4 Over Alternatives

| Tool | Cost | Complexity | Best For |
|:---|:---|:---|:---|
| GA4 | Free | Medium | General web analytics |
| Mixpanel | Freemium | High | Product SaaS |
| PostHog | Open source | High | Self-hosted |
| Plausible | Paid | Low | Privacy-first, simple |

GA4 is the right choice here: free, deeply integrated with Google Search Console, and industry standard for portfolios and products.

---

## 3. What is GTM and Why We Use It

**Google Tag Manager (GTM)** is a tag management system. Think of it as a middleman between your site and every third-party analytics/marketing tool.

### The Problem GTM Solves

Without GTM, every time you want to add or change a tracking event, you need to:
1. Modify your Next.js source code.
2. Open a PR, get it reviewed, merge it.
3. Wait for a Vercel deployment.

With GTM:
1. Log into GTM dashboard.
2. Add/modify a trigger and tag.
3. Preview → Publish. Done. No code deploy.

### GTM as a Router

```
Your Site                     GTM Container                 Tools
─────────────────────────     ──────────────────────        ─────────────────────
window.dataLayer.push(...)  → Triggers match events     →   Google Analytics 4
                              Tags fire conditionally    →   Facebook Pixel (future)
                                                         →   LinkedIn Insight (future)
                                                         →   HotJar (future)
```

### One Snippet, All Tools

You embed one GTM snippet in your site. From GTM's dashboard you can then route events to *any* tool — no additional code changes needed. This is why GTM is the production standard for any site that will add marketing tools over time.

---

## 4. How GA4 + GTM Work Together

There are two architectures. We must choose one (running both causes double-counting):

### Architecture A — GTM Only (Recommended)

```
Site code pushes to dataLayer
        ↓
GTM Container reads dataLayer
        ↓
GTM fires a "GA4 Configuration" Tag on All Pages
GTM fires "GA4 Event" Tags on custom events
        ↓
GA4 Dashboard receives all data
```

**Pros:** All tracking lives in GTM. One place to add/remove any tool. No redeploys for tracking changes.

### Architecture B — Direct GA4 Only

```
Site code calls window.gtag() directly
        ↓
GA4 Dashboard receives events
```

**Pros:** Simpler. No GTM to manage.
**Cons:** Every tracking change requires a code deploy.

> **This project currently runs BOTH simultaneously** — which causes double page views in GA4. See §9 for the fix.

---

## 5. The GTM Script — What GTM Asks You to Add

When you create a GTM container, GTM shows you two snippets to install.

### Snippet 1 — Goes in `<head>`

GTM says: *"Copy this and paste it as close to the opening `<head>` tag as possible."*

```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- End Google Tag Manager -->
```

**How this is handled in Next.js (`src/app/layout.tsx`):**

```tsx
{gtmId && gtmId.startsWith("GTM-") && (
  <Script id="google-tag-manager" strategy="afterInteractive">
    {`(function(w,d,s,l,i){...})(window,document,'script','dataLayer','${gtmId}');`}
  </Script>
)}
```

> `strategy="afterInteractive"` is the correct Next.js equivalent of placing a script in `<head>`. GTM is async so it does not block page rendering regardless.

### Snippet 2 — Goes immediately after `<body>`

GTM says: *"Paste this immediately after the opening `<body>` tag."*

```html
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
```

**Already in the codebase (`src/app/layout.tsx`):**

```tsx
{gtmId && gtmId.startsWith("GTM-") && (
  <noscript>
    <iframe src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
      height="0" width="0" style={{ display: "none", visibility: "hidden" }} />
  </noscript>
)}
```

**Both snippets are implemented. You only need `NEXT_PUBLIC_GTM_ID` set as an environment variable and GTM configured internally.**

---

## 6. The Single Source of Truth — Our Event Registry

All analytics configuration lives in **one file**: `src/utils/analytics.ts`.

**Rule: Never write a raw event name string in a component.** Always import from the registry.

### Why This Matters

Without a registry, you get this across your codebase:

```tsx
// Navbar
trackInteraction("nav_click", ...)

// Footer
trackInteraction("nav_click", ...)  // typo: "nav-click"? Same thing? Different report in GA4?

// Somewhere else
gtag("event", "navigation_click", ...) // completely different name — unmatchable in GTM
```

With the registry, there is exactly one truth:

```tsx
// src/utils/analytics.ts — the ONLY place names are declared
export const ANALYTICS_EVENTS = {
  NAV_CLICK: "nav_click",
  SOCIAL_CLICK: "social_click",
  // ...
} as const;
```

Every component imports this:

```tsx
import { trackInteraction, ANALYTICS_EVENTS } from "@/utils/analytics";

trackInteraction(ANALYTICS_EVENTS.NAV_CLICK, { label: "About", href: "/#about", location: "navbar" });
```

If you rename an event, change it in `ANALYTICS_EVENTS` once → TypeScript will immediately flag every call site that breaks.

### The Four Layers in `analytics.ts`

| Layer | What It Does |
|:---|:---|
| `ANALYTICS_EVENTS` | Declares event name constants |
| `EVENT_CATEGORY_MAP` | Maps each event → GA4 category (e.g., `nav_click` → `"Navigation"`) |
| `AnalyticsEventPayloads` | TypeScript interface — enforces correct payload per event |
| `trackInteraction()` | The only public function components call |

---

## 7. Data Flow: Click → Dashboard

Tracing a single event end-to-end:

```
User clicks "About" in Navbar
    │
    ▼
onClick fires in Navbar/index.tsx:
trackInteraction(ANALYTICS_EVENTS.NAV_CLICK, {
    label: "About", href: "/#about", location: "navbar"
})
    │
    ▼
analytics.ts resolves:
- category = EVENT_CATEGORY_MAP["nav_click"] → "Navigation"
- label    = resolveLabel(...)               → "About"
    │
    ├──────────────────────────────────────────────┐
    ▼                                              ▼
window.dataLayer.push({                   window.gtag("event", "nav_click", {
    event: "nav_click",                       event_category: "Navigation",
    event_category: "Navigation",             event_label: "About",
    event_label: "About",                     location: "navbar"
    location: "navbar",                   })
    href: "/#about"                       (only if gtag.js also loaded)
})
    │
    ▼
GTM Container wakes up, reads dataLayer push
Finds Trigger: "Custom Event = nav_click" → MATCH
Fires Tag: "GA4 - nav_click"
    │
    ▼
GA4 receives event:
    property:   G-XXXXXXXXXX
    event:      nav_click
    parameters: {location: "navbar", event_label: "About"}
    │
    ▼
GA4 Realtime Report — visible in ~30 seconds
GA4 Standard Reports — visible within 24-48 hours
```

---

## 8. What Is Currently Wired Up

| Component | Event | Status |
|:---|:---|:---|
| Navbar links (desktop + mobile) | `NAV_CLICK` | ✅ Done |
| Footer nav links | `NAV_CLICK` | ✅ Done |
| Footer social icons | `SOCIAL_CLICK` | ✅ Done |
| Hero CTA buttons | `NAV_CLICK` | ✅ Done |
| Hero Resume button | `RESUME_VIEW` | ✅ Done |
| ProjectCard "View Project" | `PROJECT_CLICK` | ✅ Done |
| Contact form success | `CONTACT_SUBMIT` (status: success) | ✅ Done |
| Contact form error | `CONTACT_SUBMIT` (status: error) | ✅ Done |
| GTM `<head>` script | — | ✅ In layout.tsx |
| GTM `<body>` noscript | — | ✅ In layout.tsx |
| GA4 direct gtag.js | — | ✅ In layout.tsx |

---

## 9. What Is Pending (End-to-End)

### 🔴 P1 — Blockers (data loss without these)

#### 1. GTM Container Not Configured

Both GTM scripts are in the codebase but the GTM container itself has no Tags, Triggers, or Variables set up. **Events push to `dataLayer` but GTM does nothing with them.** GA4 only receives events because of the parallel `gtag.js` script.

→ Fix: Complete §10 (GTM Dashboard configuration).

#### 2. Double-Tracking (Direct GA4 + GTM simultaneously)

`layout.tsx` loads both `gtag.js` and the GTM container. If GTM is configured with a GA4 Configuration Tag, every page view is counted **twice** in GA4.

→ Fix (choose one):
- **GTM-only**: Remove `NEXT_PUBLIC_GA_ID` from env vars and delete the `gtag.js` block in `layout.tsx`. Add a GA4 Configuration Tag inside GTM.
- **Direct GA4 only**: Remove `NEXT_PUBLIC_GTM_ID`, remove the GTM blocks from `layout.tsx`. Lose GTM flexibility.

#### 3. Client-Side Page View Tracking Missing

Next.js App Router uses soft (client-side) navigation — the page never fully reloads when clicking links. GA4 only auto-fires `page_view` on hard loads. **Every blog post visit after the first page load is missed.**

→ Fix: Create `src/components/RouteChangeTracker/index.tsx`:

```tsx
"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function RouteChangeTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = pathname + (searchParams.toString() ? `?${searchParams}` : "");
    (window as any).dataLayer?.push({ event: "page_view", page_path: url });
    (window as any).gtag?.("event", "page_view", { page_path: url, page_title: document.title });
  }, [pathname, searchParams]);

  return null;
}
```

Add to `layout.tsx` inside `<Providers>`:

```tsx
import { Suspense } from "react";
import RouteChangeTracker from "@/components/RouteChangeTracker";

<Providers>
  <Suspense fallback={null}>
    <RouteChangeTracker />
  </Suspense>
  <Navbar ... />
```

---

### 🟡 P2 — Important (incomplete coverage)

#### 4. Blog Post View Event (`BLOG_VIEW`)

`BLOG_VIEW` is declared in the registry but never fired. Individual blog post visits are untracked.

→ Fix: Create a thin client component `BlogViewTracker` and add it to `src/app/blogs/[slug]/page.tsx`:

```tsx
// src/features/blog/BlogViewTracker.tsx
"use client";
import { useEffect } from "react";
import { trackInteraction, ANALYTICS_EVENTS } from "@/utils/analytics";

export default function BlogViewTracker({ title, slug, tags }: { title: string; slug: string; tags: string[] }) {
  useEffect(() => {
    trackInteraction(ANALYTICS_EVENTS.BLOG_VIEW, { title, slug, tags });
  }, [title, slug, tags]);
  return null;
}
```

#### 5. Contact Section Social Icons Not Tracked

The social icons inside the Contact section header are not tracked. Only Footer social icons were updated.

→ Fix: Add `onClick` with `ANALYTICS_EVENTS.SOCIAL_CLICK` to the `<a>` tags in `Contact/index.tsx` around line 93.

#### 6. GA4 Custom Dimensions Not Registered

You're sending custom parameters (`location`, `platform`, `projectName`) with events, but GA4 has no idea what they are. They exist in the data but are not available as filters in GA4 reports.

→ Fix: Register them in GA4 Admin (see §11).

---

### 🟢 P3 — Nice to Have

#### 7. `PAGE_END_REACHED` Event Not Wired

Declared in registry, never fired. Would tell you which users read to the bottom.

→ Fix: Add an `IntersectionObserver` in the `Footer` component that fires `ANALYTICS_EVENTS.PAGE_END_REACHED` when the footer enters the viewport.

#### 8. `PROJECT_VIEW` Event Not Wired

Declared in registry, never fired. Would tell you which projects were *seen* vs. which were *clicked*.

→ Fix: `IntersectionObserver` on each `ProjectCard`.

#### 9. `RESUME_DOWNLOAD` Not Differentiated From `RESUME_VIEW`

Currently only `RESUME_VIEW` fires. If the resume is a downloadable PDF, add a separate download tracking event using `ANALYTICS_EVENTS.RESUME_DOWNLOAD`.

---

## 10. GTM Dashboard — What to Configure

Log into [tagmanager.google.com](https://tagmanager.google.com) → your container.

### Step 1: Variables (User-Defined → Data Layer Variable)

| Variable Name | Data Layer Variable Name |
|:---|:---|
| `DL - event_category` | `event_category` |
| `DL - event_label` | `event_label` |
| `DL - location` | `location` |
| `DL - platform` | `platform` |
| `DL - projectName` | `projectName` |
| `DL - status` | `status` |
| `DL - page_path` | `page_path` |

### Step 2: Triggers (Custom Event)

| Trigger Name | Event Name Equals |
|:---|:---|
| `CE - nav_click` | `nav_click` |
| `CE - social_click` | `social_click` |
| `CE - resume_view` | `resume_view` |
| `CE - project_click` | `project_click` |
| `CE - contact_submit` | `contact_submit` |
| `CE - blog_view` | `blog_view` |
| `CE - page_view` | `page_view` |

### Step 3: Tags (GA4 Event Tags)

All tags → **Measurement ID: `G-XXXXXXXXXX`**

| Tag Name | GA4 Event Name | Parameters | Trigger |
|:---|:---|:---|:---|
| `GA4 - nav_click` | `nav_click` | `location: {{DL - location}}` | `CE - nav_click` |
| `GA4 - social_click` | `social_click` | `platform: {{DL - platform}}` | `CE - social_click` |
| `GA4 - resume_view` | `resume_view` | — | `CE - resume_view` |
| `GA4 - project_click` | `project_click` | `project_name: {{DL - projectName}}` | `CE - project_click` |
| `GA4 - contact_submit` | `contact_submit` | `status: {{DL - status}}` | `CE - contact_submit` |
| `GA4 - blog_view` | `blog_view` | `page_path: {{DL - page_path}}` | `CE - blog_view` |
| `GA4 - SPA page_view` | `page_view` | `page_path: {{DL - page_path}}` | `CE - page_view` |

### Step 4: GA4 Configuration Tag (if using GTM-only mode)

**Tag type:** Google Analytics: GA4 Configuration
- Measurement ID: `G-XXXXXXXXXX`
- Trigger: **All Pages**
- Send page view: **Yes**

### Step 5: Preview → Test → Publish

1. Click **Preview**, enter your site URL.
2. Trigger each tracked event (click nav, submit form, click project).
3. Confirm events appear in GTM debug panel.
4. Check **GA4 DebugView** (`Admin → DebugView`) — events should appear in seconds.
5. Click **Submit → Publish**.

---

## 11. GA4 Dashboard — What to Set Up

### Register Custom Dimensions

**Admin → Custom Definitions → Custom Dimensions → Create**

| Display Name | Scope | Parameter Name |
|:---|:---|:---|
| Nav Location | Event | `location` |
| Social Platform | Event | `platform` |
| Project Name | Event | `project_name` |
| Link Type | Event | `link_type` |
| Contact Status | Event | `status` |
| Blog Post Title | Event | `page_title` |

> Custom dimensions must be registered **before** they appear as filterable dimensions. Historical data is not backfilled.

### Enable Enhanced Measurement

**Admin → Data Streams → [Your Stream] → Enhanced Measurement → ON**

This automatically tracks:
- Scroll depth (% of page scrolled)
- Outbound link clicks
- Site search
- Video engagement (YouTube embeds)
- File downloads

### Explorations to Build (after 1 week of data)

- **Navigation Funnel**: Which sections are clicked most → does it correlate with contact form opens?
- **Blog Engagement**: Posts viewed, scroll depth, exit rate per post.
- **Project Popularity**: Which project gets clicked most, live vs repo split.
- **Contact Conversion**: `page_view /` → `contact_submit (success)` funnel.
- **Resume Interest**: How many users click resume within 30 seconds of landing?

### Link GA4 to Google Search Console

**Admin → Search Console Links** — shows which search queries bring people to your site. Critical for understanding SEO performance.

---

## 12. How to Scale This

### Pattern: Central Registry, Typed Contracts

The `ANALYTICS_EVENTS` registry in `analytics.ts` is the foundation of scaling:

- **New developer joins** → reads `analytics.ts` to understand every event in the system.
- **Business asks for new metric** → add one entry to registry, one type, one GTM tag.
- **Rename an event** → change it in registry, TypeScript flags all broken call sites immediately.
- **Wrong payload** → TypeScript compile error before it reaches GA4.

### Pattern: Thin Call Sites

Components should be dumb about analytics:

```tsx
// ✅ Correct — component knows nothing about categories, labels, or GA4
onClick={() => trackInteraction(ANALYTICS_EVENTS.PROJECT_CLICK, { projectName: project.name, linkType: "live" })}

// ❌ Wrong — component knows too much
onClick={() => gtag("event", "project_click", { event_category: "Projects", ... })}
```

### Pattern: GTM as the Deployment Layer

When you need to change a tracking parameter or add a new marketing tool:
- **Don't touch Next.js code** — update GTM.
- Keep the `ANALYTICS_EVENTS` registry as the contract between code and GTM.

### When You Outgrow This

| Scale | Solution |
|:---|:---|
| High event volume (>10M/mo) | Upgrade GA4, consider BigQuery export |
| Multiple sites | GA4 cross-domain tracking |
| Marketing automation | Integrate with Google Ads via GTM |
| User behavior heatmaps | Add HotJar via GTM (no code change) |
| A/B testing | Add Optimize or VWO via GTM |

---

## 13. Adding a New Event — The Full Workflow

Every new event requires these steps in order. Do not skip any.

**Example: tracking a newsletter signup.**

### Step 1 — Add to `ANALYTICS_EVENTS`

```typescript
// src/utils/analytics.ts
export const ANALYTICS_EVENTS = {
  // ... existing events
  NEWSLETTER_SIGNUP: "newsletter_signup",
} as const;
```

### Step 2 — Add payload type to `AnalyticsEventPayloads`

```typescript
export interface AnalyticsEventPayloads {
  // ...
  [ANALYTICS_EVENTS.NEWSLETTER_SIGNUP]: { email_domain: string };
}
```

### Step 3 — Add category to `EVENT_CATEGORY_MAP`

```typescript
export const EVENT_CATEGORY_MAP: Record<AnalyticsEventName, string> = {
  // ...
  [ANALYTICS_EVENTS.NEWSLETTER_SIGNUP]: "Engagement",
};
```

### Step 4 — Add label resolver (if applicable)

```typescript
case ANALYTICS_EVENTS.NEWSLETTER_SIGNUP:
  return payload.email_domain;
```

### Step 5 — Call from component

```tsx
import { trackInteraction, ANALYTICS_EVENTS } from "@/utils/analytics";

trackInteraction(ANALYTICS_EVENTS.NEWSLETTER_SIGNUP, { email_domain: "gmail.com" });
```

### Step 6 — Add Trigger in GTM

Custom Event → Event Name equals `newsletter_signup`.

### Step 7 — Add GA4 Event Tag in GTM

Fire on new trigger → map `email_domain` parameter → Publish.

### Step 8 — Register Custom Dimension in GA4 (if new parameter)

Admin → Custom Definitions → Create `email_domain`.

---

## 14. Environment Variables

### Local `.env`

```bash
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

### Vercel Dashboard

**Settings → Environment Variables → Production + Preview**

| Variable | Required | Notes |
|:---|:---|:---|
| `NEXT_PUBLIC_GA_ID` | Yes (if direct GA4 mode) | `G-XXXXXXXXXX` |
| `NEXT_PUBLIC_GTM_ID` | Yes | `GTM-XXXXXXX` |
| `NEXT_PUBLIC_BASE_URL` | Yes | `https://divalsehgal.vercel.app` |
| `NOTION_API_KEY` | Yes | Blog integration |
| `NOTION_DATABASE_ID` | Yes | Blog posts database |
| `NOTION_CONTACT_DB_ID` | Yes | Contact submissions |

---

*Keep this doc and `src/utils/analytics.ts` in sync — they describe the same system from different angles.*
