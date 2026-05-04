# Analytics Implementation Summary

## Overview

This document summarizes the complete analytics implementation for the portfolio using **Google Tag Manager (GTM)** and **Google Analytics 4 (GA4)**. The approach centralizes event management through a registry pattern, ensuring consistency and type safety across the entire application.

## Architecture

### Data Flow

```
Component
    ↓
trackInteraction(ANALYTICS_EVENTS.EVENT_NAME, payload)
    ↓
Analytics Engine (src/utils/analytics.ts)
    ├─ Resolves event category from registry
    ├─ Derives label from payload
    └─ Pushes to dataLayer
    ↓
GTM Container (via GTM script tag)
    ├─ Listens to dataLayer events
    ├─ Routes events to GA4 Tags
    ├─ Applies transformations/enrichment
    └─ Sends to GA4
    ↓
GA4 (Google Analytics 4)
    ├─ Records events with categories/labels
    ├─ Tracks custom dimensions
    └─ Generates reports in GA Dashboard
```

### Key Principles

1. **Single Source of Truth**: All event names defined in `ANALYTICS_EVENTS` registry
2. **Type Safety**: TypeScript enforces correct payload shape per event
3. **Separation of Concerns**: Components only call `trackInteraction()`, GTM handles routing
4. **No Direct GA4**: All events flow through dataLayer → GTM → GA4 (except legacy direct gtag)
5. **Production-Safe**: Build process works correctly with GTM-only setup

## Event Registry

### File: `src/utils/analytics.ts`

The event registry (`ANALYTICS_EVENTS`) is the canonical source for all event names:

```typescript
export const ANALYTICS_EVENTS = {
  // Navigation
  NAV_CLICK: "nav_click",

  // Social
  SOCIAL_CLICK: "social_click",

  // Resume
  RESUME_VIEW: "resume_view",
  RESUME_DOWNLOAD: "resume_download",

  // Projects
  PROJECT_VIEW: "project_view",
  PROJECT_CLICK: "project_click",

  // Contact
  CONTACT_SUBMIT: "contact_submit",

  // Engagement
  PAGE_END_REACHED: "page_end_reached",
  BLOG_VIEW: "blog_view",
};
```

### Event Categories

Each event is mapped to a GA4 category:

| Event | Category | Purpose |
|-------|----------|---------|
| `nav_click` | Navigation | User navigates to a section |
| `social_click` | Social | User clicks social media links |
| `resume_view` | Resume | User views/downloads resume |
| `resume_download` | Resume | User downloads resume |
| `project_view` | Projects | User views project details |
| `project_click` | Projects | User clicks project link |
| `contact_submit` | Contact | User submits contact form |
| `page_end_reached` | Engagement | User scrolls to footer |
| `blog_view` | Blog | User views blog post |

## Implementation Status

### Implemented Events ✓

#### 1. **Navigation Clicks** (`NAV_CLICK`)
- **Location**: Navbar (desktop & mobile), Footer, Hero section
- **Payload**: `{ label: string, href: string, location: "navbar" | "footer" }`
- **Components**:
  - `src/components/Navbar/index.tsx` (lines 157, 188)
  - `src/components/Footer/index.tsx` (line 65)
  - `src/containers/Home/Hero/index.tsx` (line 90)

#### 2. **Social Media Clicks** (`SOCIAL_CLICK`)
- **Location**: About section, Contact section, Footer
- **Payload**: `{ platform: string, href: string }`
- **Components**:
  - `src/containers/Home/About/index.tsx` (lines 125-130)
  - `src/containers/Home/Contact/index.tsx` (social links)
  - `src/components/Footer/index.tsx` (line 90)

#### 3. **Resume Interactions** (`RESUME_VIEW`)
- **Location**: Hero section
- **Payload**: `{ label?: string }`
- **Components**:
  - `src/containers/Home/Hero/index.tsx` (line 88)
- **Status**: Currently tracking view action. Separate `RESUME_DOWNLOAD` event exists in registry but not actively tracked.

#### 4. **Project Clicks** (`PROJECT_CLICK`)
- **Location**: Project cards
- **Payload**: `{ projectName: string, linkType: "live" | "repo" }`
- **Components**:
  - `src/components/ProjectCard/index.tsx` (line 37)

#### 5. **Contact Form Submission** (`CONTACT_SUBMIT`)
- **Location**: Contact section
- **Payload**: `{ status: "success" | "error", message?: string }`
- **Components**:
  - `src/containers/Home/Contact/index.tsx` (lines 70, 75)
- **Status**: Recently fixed - now properly handles submission errors and tracks events with status

### Pending Implementation

#### 1. **Blog View Tracking** (`BLOG_VIEW`)
- **Required**: Client-side component to track when user views a blog post
- **Suggested Implementation**: Create `BlogViewTracker` component that:
  - Wraps `src/app/blogs/[slug]/page.tsx`
  - Sends event on component mount with: `{ title, slug, tags }`
  - Requires `"use client"` wrapper since blogs are server-rendered

#### 2. **Page End Tracking** (`PAGE_END_REACHED`)
- **Required**: Detect when user scrolls to footer
- **Suggested Implementation**: Create `PageEndTracker` component that:
  - Uses intersection observer to detect footer in viewport
  - Fires event once per page load
  - Payload: `{ label?: "Reached Footer" }`

#### 3. **Project View Tracking** (`PROJECT_VIEW`)
- **Status**: Defined in registry but no tracking implementation
- **Note**: Could be combined with `PROJECT_CLICK` or tracked separately on modal/detail pages

## GTM Configuration

### Required Tags in GTM Container

1. **GA4 Configuration Tag**
   - Initializes GA4 connection
   - Measurement ID: `G-4X085TNM6R` (from `NEXT_PUBLIC_GA_ID`)
   - Trigger: All Pages

2. **GA4 Event Tags** (7 total)
   - Each mapped to a dataLayer event
   - Manual creation required for each event type
   - See `docs/analytics-setup.md` for detailed setup

### Data Layer Variables (GTM)

```javascript
// Components push to dataLayer:
window.dataLayer.push({
  event: "nav_click",           // Event name from ANALYTICS_EVENTS
  event_category: "Navigation", // From EVENT_CATEGORY_MAP
  event_label: "About",         // Derived from payload via resolveLabel()
  label: "About",               // Original payload properties
  href: "/#about",
  location: "navbar"
});
```

## Component Integration Guide

### How Components Track Events

All components follow this pattern:

```typescript
import { trackInteraction, ANALYTICS_EVENTS } from "@/utils/analytics";

function MyComponent() {
  return (
    <button
      onClick={() =>
        trackInteraction(ANALYTICS_EVENTS.SOCIAL_CLICK, {
          platform: "Twitter",
          href: "https://twitter.com/...",
        })
      }
    >
      Follow
    </button>
  );
}
```

### Adding a New Event

1. **Define in Registry** (`src/utils/analytics.ts`):
   ```typescript
   export const ANALYTICS_EVENTS = {
     // ... existing events
     MY_NEW_EVENT: "my_new_event",
   };
   ```

2. **Add Payload Type**:
   ```typescript
   export interface AnalyticsEventPayloads {
     [ANALYTICS_EVENTS.MY_NEW_EVENT]: { myParam: string };
   }
   ```

3. **Add Category Mapping**:
   ```typescript
   export const EVENT_CATEGORY_MAP = {
     [ANALYTICS_EVENTS.MY_NEW_EVENT]: "My Category",
   };
   ```

4. **Add Label Resolver** (if needed):
   ```typescript
   case ANALYTICS_EVENTS.MY_NEW_EVENT:
     return payload.myParam;
   ```

5. **Use in Component**:
   ```typescript
   trackInteraction(ANALYTICS_EVENTS.MY_NEW_EVENT, { myParam: "value" });
   ```

## Testing

### Unit Tests Location
- `src/utils/analytics.test.ts` - Core analytics engine tests
- `src/containers/Home/Contact/test.tsx` - Contact form tracking tests (updated)
- `src/containers/Home/Hero/test.tsx` - Hero section tracking tests

### Manual Testing

1. **In Development**:
   ```bash
   npm run dev
   ```
   - Events logged to browser console with `[Analytics]` prefix
   - Check DevTools console for trackInteraction calls

2. **GTM Preview Mode**:
   - Open GTM container in Preview mode
   - Navigate through app and verify events in debugger
   - Check dataLayer in browser console: `window.dataLayer`

3. **GA4 DebugView**:
   - In GA4 dashboard, enable DebugView filter
   - Real-time event tracking as you browse
   - Verify event names, categories, labels match expected values

## Production Deployment Checklist

- [x] All event names defined in `ANALYTICS_EVENTS` registry
- [x] Event categories mapped in `EVENT_CATEGORY_MAP`
- [x] Payload types defined in `AnalyticsEventPayloads`
- [x] Components use `trackInteraction()` (not direct dataLayer pushes)
- [x] GTM container created with GA4 Configuration Tag
- [x] GA4 Event Tags configured for all events
- [x] GTM script tag added to `src/app/layout.tsx`
- [x] Contact form submission errors now properly handled
- [x] Test file updated to use new analytics API
- [ ] Pending: BlogViewTracker component implementation
- [ ] Pending: PageEndTracker component implementation
- [ ] Verified: Events flow through dataLayer → GTM → GA4
- [ ] Verified: GA4 DebugView shows incoming events

## Recent Fixes

### Contact Form Submission (Fixed May 3, 2026)

**Issue**: Contact form errors were silently swallowed, form appeared to succeed but didn't submit.

**Fix**:
- Updated `src/lib/services/notion.ts` to throw errors instead of silently returning
- Errors now propagate to action handler and show in toast
- Updated test file to use new `trackInteraction` API

**Files Changed**:
- `src/lib/services/notion.ts` - Error handling improvement
- `src/containers/Home/Contact/test.tsx` - API migration

## Environment Setup

Required environment variables:

```bash
# Notion Configuration (for Blog & Contact)
NOTION_API_KEY=...
NOTION_DATABASE_ID=...
NOTION_CONTACT_DB_ID=...

# GA4 Configuration
NEXT_PUBLIC_GA_ID=G-4X085TNM6R
```

GTM container ID is embedded in `src/app/layout.tsx` script tag.

## Troubleshooting

### Events Not Appearing in GA4

1. **Check dataLayer**:
   ```javascript
   console.log(window.dataLayer);
   ```

2. **Verify GTM Container**:
   - Open GTM Preview mode
   - Ensure GA4 Configuration Tag is firing
   - Check trigger conditions

3. **Check Console Logs**:
   - Development mode logs all events with `[Analytics]` prefix
   - Production: Check browser console for errors

4. **GA4 DebugView**:
   - Enable in GA4 settings
   - Check real-time events dashboard
   - Verify event names match exactly

## References

- [GTM Setup Guide](./analytics-setup.md)
- [ISR Strategy](./isr-notion-strategy.md)
- [CSS Architecture](./css-architecture.md)
- [Google Tag Manager Docs](https://support.google.com/tagmanager)
- [GA4 Implementation Guide](https://support.google.com/analytics/answer/9304153)
