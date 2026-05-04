# 📊 Analytics Architecture — GA4 + GTM

> A production-level guide for understanding, implementing, and scaling analytics on this portfolio.

---

## Table of Contents

1. [Why Analytics?](#1-why-do-we-even-do-this)
2. [GA4 Overview](#2-what-is-ga4-and-why-we-use-it)
3. [GTM Overview](#3-what-is-gtm-and-why-we-use-it)
4. [Data Layer Architecture](#4-data-layer-architecture-push--gtm--ga4)
5. [GTM Setup](#5-gtm-setup-the-two-required-snippets)
6. [Event Registry](#6-understanding-your-event-registry)
7. [Event Flow Example](#7-event-flow-visual-example)
8. [Implementation Roadmap](#8-next-steps-implementation-roadmap)
9. [GTM Dashboard Configuration](#9-gtm-dashboard--what-to-configure)
10. [GA4 Dashboard Setup](#10-ga4-dashboard--what-to-set-up)
11. [Scaling This System](#11-how-to-scale-this)
12. [Adding New Events](#12-adding-a-new-event--the-full-workflow)
13. [Environment Variables](#13-environment-variables)

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

## 4. Data Layer Architecture: Push → GTM → GA4

### The GTM Data Layer Approach (Recommended)

Your site and GTM communicate through a JavaScript array called `window.dataLayer`.

**Flow:**

```
Component Code
    │
    ├─ trackInteraction(ANALYTICS_EVENTS.NAV_CLICK, {...})
    │
    ▼
window.dataLayer.push({
    event: "nav_click",
    event_category: "Navigation",
    event_label: "About",
    location: "navbar"
})
    │
    ▼ (GTM wakes up and inspects every dataLayer push)
    │
GTM Container
    ├─ Matches Trigger: "Custom Event = nav_click" ✓
    ├─ Fires Tag: "GA4 - nav_click"
    │
    ▼
GA4 Property (G-XXXXXXXXXX)
    │
    ├─ Receives: event=nav_click
    ├─ Receives: parameters={event_category, event_label, location}
    │
    ▼
GA4 Dashboard (real-time + 24-48h reports)
```

### Why This Approach

- **Separation of Concerns**: Your code pushes data; GTM routes it
- **No Code Deploy for Tracking Changes**: Modify GTM dashboard → immediate effect
- **Future-Proof**: Add Facebook Pixel, LinkedIn Insight, HotJar, etc. without touching code
- **Single Source of Truth**: `ANALYTICS_EVENTS` registry is your contract with GTM

### Two Modes (Choose One — NOT Both)

| Mode | Setup | Redeploys for Changes |
|:---|:---|:---|
| **GTM-Only** (recommended) | Delete `NEXT_PUBLIC_GA_ID`, remove `gtag.js` from layout | No |
| **Direct GA4** (simpler) | Delete `NEXT_PUBLIC_GTM_ID`, remove GTM from layout | Yes, every tracking change |

> **Current Status**: We're running both, causing double page views. Priority 1 is to choose one (§9).

---

## 5. GTM Setup: The Two Required Snippets

When you create a GTM container, Google shows you snippets to install. **Both are already in `src/app/layout.tsx`:**

### Snippet 1 — Container Script (`<head>`)

```tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        {gtmId && gtmId.startsWith("GTM-") && (
          <Script id="google-tag-manager" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];...})(window,document,'script','dataLayer','${gtmId}');`}
          </Script>
        )}
      </head>
      <body>
```

### Snippet 2 — Fallback (`<body>`)

```tsx
export default function RootLayout({ children }) {
  return (
    <body>
      {gtmId && gtmId.startsWith("GTM-") && (
        <noscript>
          <iframe src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
            height="0" width="0" style={{ display: "none", visibility: "hidden" }} />
        </noscript>
      )}
```

**What You Need to Do**: Set `NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX` in `.env.local`.

## 6. Understanding Your Event Registry

All events live in one file: `src/utils/analytics.ts`. This is the single source of truth.

```typescript
// Registry: declares all event names (never spelling mistakes)
export const ANALYTICS_EVENTS = {
  NAV_CLICK: "nav_click",
  SOCIAL_CLICK: "social_click",
  // ...
} as const;

// Category mapper: event → GA4 category
export const EVENT_CATEGORY_MAP: Record<AnalyticsEventName, string> = {
  [ANALYTICS_EVENTS.NAV_CLICK]: "Navigation",
  [ANALYTICS_EVENTS.SOCIAL_CLICK]: "Social",
};

// Type enforcer: ensures correct payload per event
export interface AnalyticsEventPayloads {
  [ANALYTICS_EVENTS.NAV_CLICK]: { label: string; location: "navbar" | "footer" };
  [ANALYTICS_EVENTS.SOCIAL_CLICK]: { platform: string; href: string };
}

// Public API: what components call
export const trackInteraction = <T extends AnalyticsEventName>(
  eventName: T,
  payload: AnalyticsEventPayloads[T]
) => {
  const category = EVENT_CATEGORY_MAP[eventName];
  const label = resolveLabel(eventName, payload);

  // Push to data layer (GTM picks this up)
  window.dataLayer.push({ event: eventName, event_category: category, event_label: label, ...payload });

  // Also send to gtag if present (backup)
  window.gtag?.("event", eventName, { event_category: category, event_label: label, ...payload });
};
```

**Key Insight**: Components only import `ANALYTICS_EVENTS` and `trackInteraction()`. They never write raw event names or know about categories.

---

## 7. Event Flow: Visual Example

**User clicks "About" in navbar:**

```
Navbar onClick handler
  ↓
trackInteraction(ANALYTICS_EVENTS.NAV_CLICK, { label: "About", location: "navbar" })
  ↓
analytics.ts resolves:
  ├─ category = "Navigation" (from EVENT_CATEGORY_MAP)
  ├─ label = "About" (from resolveLabel)
  │
  ├─→ window.dataLayer.push({
  │    event: "nav_click",
  │    event_category: "Navigation",
  │    event_label: "About",
  │    location: "navbar"
  │  }) ← GTM reads this!
  │
  └─→ window.gtag?.("event", "nav_click", {...}) ← Backup direct GA4
       (only if gtag.js loaded)
  ↓
GTM Container wakes up
  ├─ Finds Match: Custom Event = "nav_click"
  ├─ Fires Tag: "GA4 - nav_click"
  │
  ↓
GA4 Property (G-XXXXXXXXXX)
  ├─ event: nav_click
  ├─ parameters: { event_category, event_label, location }
  │
  ↓
GA4 Realtime Dashboard (30 seconds)
GA4 Reports (24-48 hours)
```

## 8. Next Steps: Implementation Roadmap

### Immediate (Week 1) — REQUIRED

#### Step 1️⃣: Choose Your Architecture
**Status**: Blocked — currently running both (causing double page views)

**Decision**: GTM-Only or Direct GA4?

**GTM-Only (Recommended)** ← Pick this
- Pro: No code deploy for tracking changes
- How: Delete `NEXT_PUBLIC_GA_ID` env var, remove `gtag.js` from layout.tsx
- Add GTM "GA4 Configuration Tag" set to trigger "All Pages"

**Direct GA4**
- Pro: Simpler setup
- Con: Every tracking change needs a code deploy
- How: Delete `NEXT_PUBLIC_GTM_ID` env var, remove GTM from layout.tsx

**Action**: Make the choice, then follow steps 2-3

#### Step 2️⃣: Configure GTM Dashboard (if GTM-Only mode)
**Time**: 30 minutes

1. Log into [tagmanager.google.com](https://tagmanager.google.com)
2. Create Variables (Data Layer Variables — see §10 table)
3. Create Triggers (Custom Event triggers — see §10 table)
4. Create GA4 Event Tags (see §10 table)
5. Preview → Test → Publish

**Reference**: Use tables in §10 for exact names and mappings

#### Step 3️⃣: Register Custom Dimensions in GA4
**Time**: 15 minutes

1. GA4 → Admin → Custom Definitions → Custom Dimensions
2. Register: `location`, `platform`, `project_name`, `link_type`, `status`

**Without this**: GA4 receives parameters but they won't be filterable in reports

### Important (Week 2) — HIGH VALUE

#### Step 4️⃣: Track Client-Side Page Views
**Why**: Next.js soft navigation means blog posts after first load aren't tracked

**Implementation**:
```tsx
// src/components/RouteChangeTracker/index.tsx
"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function RouteChangeTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = pathname + (searchParams.toString() ? `?${searchParams}` : "");
    window.dataLayer?.push({ event: "page_view", page_path: url });
  }, [pathname, searchParams]);

  return null;
}
```

Add to `layout.tsx`:
```tsx
<Providers>
  <Suspense fallback={null}>
    <RouteChangeTracker />
  </Suspense>
  {/* rest of layout */}
</Providers>
```

#### Step 5️⃣: Wire Blog Post Tracking
**Why**: `BLOG_VIEW` event is declared but never fired

```tsx
// src/features/blog/BlogViewTracker.tsx
"use client";
import { useEffect } from "react";
import { trackInteraction, ANALYTICS_EVENTS } from "@/utils/analytics";

export default function BlogViewTracker({ title, slug, tags }: any) {
  useEffect(() => {
    trackInteraction(ANALYTICS_EVENTS.BLOG_VIEW, { title, slug, tags });
  }, [title, slug, tags]);
  return null;
}
```

Add to `src/app/blogs/[slug]/page.tsx`:
```tsx
<BlogViewTracker title={post.title} slug={slug} tags={post.tags} />
```

### Nice to Have (Week 3+) — POLISH

#### Step 6️⃣: Scroll Depth & Footer Reach
```tsx
// Inside Footer component
useEffect(() => {
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      trackInteraction(ANALYTICS_EVENTS.PAGE_END_REACHED, {});
    }
  });
  observer.observe(footerRef.current);
}, []);
```

#### Step 7️⃣: Project Visibility Tracking
```tsx
// Inside ProjectCard component
useEffect(() => {
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      trackInteraction(ANALYTICS_EVENTS.PROJECT_VIEW, { projectName: project.name });
    }
  });
  observer.observe(cardRef.current);
}, []);
```

## 9. GTM Dashboard — What to Configure

Log into [tagmanager.google.com](https://tagmanager.google.com) → select your container.

### Variables (Data Layer Variables)

These map dataLayer properties to GTM variables so they can be reused in tags.

**Create these Data Layer Variables:**

| GTM Variable Name | Data Layer Property |
|:---|:---|
| `DL - event_category` | `event_category` |
| `DL - event_label` | `event_label` |
| `DL - location` | `location` |
| `DL - platform` | `platform` |
| `DL - project_name` | `projectName` |
| `DL - status` | `status` |
| `DL - page_path` | `page_path` |

### Triggers (Custom Event Triggers)

These fire when specific events are pushed to dataLayer.

**Create these Triggers:**

| Trigger Name | Custom Event Name |
|:---|:---|
| `CE - nav_click` | `nav_click` |
| `CE - social_click` | `social_click` |
| `CE - resume_view` | `resume_view` |
| `CE - project_click` | `project_click` |
| `CE - contact_submit` | `contact_submit` |
| `CE - blog_view` | `blog_view` |
| `CE - page_view` | `page_view` |

### Tags (GA4 Event Tags)

These send data to your GA4 property. You'll create 7 GA4 Event Tags (one for each Trigger).

#### Tag Configuration (What to Fill In)

When you create a GA4 Event Tag in GTM, you'll see these fields:

```
Tag Type:           Google Analytics: GA4 Event
Measurement ID:     G-XXXXXXXXXX (your GA4 property ID)
Event Name:         (see mapping table below)
Parameters:         (see mapping table below)
Trigger:            (see mapping table below)
```

#### Tag Mapping (Which Event → Which Parameters → Which Trigger)

**Create these 7 GA4 Event Tags** (one row = one tag):

| # | Tag Name | GA4 Event Name | Parameters | Trigger to Connect |
|---|---|---|---|---|
| 1 | `GA4 - nav_click` | `nav_click` | `location: {{DL - location}}` | `CE - nav_click` |
| 2 | `GA4 - social_click` | `social_click` | `platform: {{DL - platform}}` | `CE - social_click` |
| 3 | `GA4 - resume_view` | `resume_view` | (none) | `CE - resume_view` |
| 4 | `GA4 - project_click` | `project_click` | `project_name: {{DL - project_name}}` | `CE - project_click` |
| 5 | `GA4 - contact_submit` | `contact_submit` | `status: {{DL - status}}` | `CE - contact_submit` |
| 6 | `GA4 - blog_view` | `blog_view` | `page_path: {{DL - page_path}}` | `CE - blog_view` |
| 7 | `GA4 - page_view` | `page_view` | `page_path: {{DL - page_path}}` | `CE - page_view` |

#### How to Create Each Tag (Step-by-Step)

**For each row in the table above:**

1. **Left menu** → **Tags** → **New**
2. **Tag Name**: Enter the name (e.g., `GA4 - nav_click`)
3. **Tag Type**: `Google Analytics: GA4 Event`
4. **Measurement ID**: Paste your GA4 property ID (`G-XXXXXXXXXX`)
5. **Event Name**: Enter the GA4 Event Name (from table)
6. **Parameters** (if any):
   - Click "Add parameter"
   - **Parameter name**: Fill in left column (e.g., `location`)
   - **Parameter value**: Fill in right column using {{variable}} syntax (e.g., `{{DL - location}}`)
   - If table shows "(none)", skip this step
7. **Trigger**: Select from your Triggers list (from table, rightmost column)
8. **Save**

**Example: Creating `GA4 - nav_click` tag**

```
Tag Name:       GA4 - nav_click
Tag Type:       Google Analytics: GA4 Event
Measurement ID: G-XXXXXXXXXX
Event Name:     nav_click

Parameters:
  Parameter 1:
    Name:  location
    Value: {{DL - location}}

Trigger:        CE - nav_click ✓
```

**Example: Creating `GA4 - resume_view` tag** (no parameters)

```
Tag Name:       GA4 - resume_view
Tag Type:       Google Analytics: GA4 Event
Measurement ID: G-XXXXXXXXXX
Event Name:     resume_view

Parameters:     (skip - none needed)

Trigger:        CE - resume_view ✓
```

### GA4 Configuration Tag (if using GTM-only mode)

If you chose GTM-Only in Step 1:

**Create a GA4 Configuration Tag:**
- **Tag Type**: Google Analytics: GA4 Configuration
- **Measurement ID**: `G-XXXXXXXXXX`
- **Trigger**: All Pages
- **Send pageview**: Yes

### Testing

1. Click **Preview** at the top
2. Enter your site URL
3. Trigger events: click nav, submit form, click project, etc.
4. Confirm events appear in GTM debug panel
5. Open GA4 → Admin → **DebugView**
6. Confirm events appear in GA4 (within 30 seconds)
7. Stop Preview → Click **Submit** → **Publish**

## 10. GA4 Dashboard — What to Set Up

### Register Custom Dimensions

Log into GA4 → **Admin** → **Custom Definitions** → **Custom Dimensions** → **Create**

| Display Name | Scope | Parameter Name |
|:---|:---|:---|
| Nav Location | Event | `location` |
| Social Platform | Event | `platform` |
| Project Name | Event | `project_name` |
| Contact Status | Event | `status` |

> Custom dimensions must be created **before** sending data. Historical data won't be backfilled, but new events will include these filters.

### Enable Enhanced Measurement

**Admin** → **Data Streams** → **[Your Stream]** → **Enhanced Measurement** → **ON**

This auto-tracks:
- 📊 Scroll depth
- 🔗 Outbound link clicks
- 🎥 Video engagement (YouTube)
- 📥 File downloads

### Link to Search Console

**Admin** → **Search Console Links** — shows which search queries bring people to your site. Essential for SEO feedback.

---

## 11. How to Scale This

## 11. How to Scale This

### Core Pattern: Registry + Typed Contracts

Everything flows from `ANALYTICS_EVENTS`:

```typescript
// Single source of truth
export const ANALYTICS_EVENTS = {
  MY_NEW_EVENT: "my_new_event",
} as const;

// TypeScript enforces the payload
export interface AnalyticsEventPayloads {
  [ANALYTICS_EVENTS.MY_NEW_EVENT]: { myParam: string };
}

// Components can't get it wrong
trackInteraction(ANALYTICS_EVENTS.MY_NEW_EVENT, { myParam: "value" }); // ✓
trackInteraction(ANALYTICS_EVENTS.MY_NEW_EVENT, { wrongParam: "value" }); // ✗ TypeScript error
```

### When to Add GTM Tools

Once this system is live, adding new tools is trivial because they all read `dataLayer`:

```
Add Facebook Pixel  → New Trigger + New Tag in GTM → No code change
Add LinkedIn Insight → New Trigger + New Tag in GTM → No code change
Add HotJar           → New Trigger + New Tag in GTM → No code change
```

### Evolving Your Metrics

After 2-4 weeks with live data:

1. **Build GA4 Explorations**: Funnel analysis (landing → contact), cohort analysis (by referrer)
2. **Identify drop-off points**: Where do users stop scrolling? Which projects are ignored?
3. **Refine tracking**: Add new events based on real user behavior patterns

---

## 12. Adding a New Event — The Full Workflow

Example: tracking newsletter signups

**Step 1 — Add to registry** (`src/utils/analytics.ts`)
```typescript
export const ANALYTICS_EVENTS = {
  NEWSLETTER_SIGNUP: "newsletter_signup",
} as const;
```

**Step 2 — Add payload type**
```typescript
export interface AnalyticsEventPayloads {
  [ANALYTICS_EVENTS.NEWSLETTER_SIGNUP]: { email_domain: string };
}
```

**Step 3 — Add category**
```typescript
export const EVENT_CATEGORY_MAP = {
  [ANALYTICS_EVENTS.NEWSLETTER_SIGNUP]: "Engagement",
};
```

**Step 4 — Call from component**
```tsx
trackInteraction(ANALYTICS_EVENTS.NEWSLETTER_SIGNUP, { email_domain: domain });
```

**Step 5 — Add to GTM** (no code redeploy needed)
- Create Trigger: "Custom Event = newsletter_signup"
- Create GA4 Event Tag: "newsletter_signup"
- Map parameter: `email_domain: {{DL - email_domain}}`
- Preview → Publish

**Step 6 — Register in GA4** (optional, if new parameter)
- Admin → Custom Dimensions → Create `Email Domain`

---

## 13. Environment Variables

### Local `.env.local`

```bash
# Choose ONE mode:

# GTM-Only mode (recommended)
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX

# Direct GA4 mode (simpler, but needs code redeploy for tracking changes)
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Vercel Dashboard

**Settings → Environment Variables** (Production + Preview)

| Variable | Required | Notes |
|:---|:---|:---|
| `NEXT_PUBLIC_GTM_ID` | Yes (GTM-only mode) | `GTM-XXXXXXX` |
| `NEXT_PUBLIC_GA_ID` | Yes (Direct GA4 mode) | `G-XXXXXXXXXX` — only if not using GTM |
| `NEXT_PUBLIC_BASE_URL` | Yes | `https://divalsehgal.vercel.app` |
| `NOTION_API_KEY` | Yes | Blog integration |
| `NOTION_DATABASE_ID` | Yes | Blog posts |

---

## Quick Reference

### Architecture Decision Tree

```
Question: Do you want to add more tracking tools later?
├─ YES → Choose GTM-Only
│        ├─ Pro: No code redeploys for new tools
│        ├─ Pro: No double-counting
│        └─ Action: Delete NEXT_PUBLIC_GA_ID, complete §8 Step 1 & 2
│
└─ NO → Choose Direct GA4
         ├─ Pro: Simpler setup
         ├─ Con: Every tracking change needs a code deploy
         └─ Action: Delete NEXT_PUBLIC_GTM_ID, remove GTM from layout.tsx
```

### Current Status Checklist

- [ ] Architecture decision made (GTM-Only or Direct GA4)
- [ ] Unnecessary env var and code removed
- [ ] GTM Dashboard configured (if GTM-Only) or direct GA4 (if Direct)
- [ ] Custom Dimensions registered in GA4
- [ ] RouteChangeTracker component added to layout
- [ ] BlogViewTracker component added to blog post page
- [ ] Events appearing in GA4 DebugView within 30 seconds

---

*Keep this doc in sync with `src/utils/analytics.ts` — they describe the same system from different angles.*
