/**
 * @file analytics.ts
 * @description Single source of truth for all analytics events.
 *
 * ARCHITECTURE:
 * - ANALYTICS_EVENTS: The canonical registry of every event name.
 *   Import this instead of writing string literals anywhere.
 * - EVENT_CATEGORY_MAP: Maps each event to its GA4 category.
 *   Change a category here and it propagates everywhere automatically.
 * - AnalyticsEventPayloads: TypeScript interface enforcing payload shape per event.
 * - trackInteraction(): The only public API components should call.
 * - trackEvent(): Low-level helper — not for direct component use.
 *
 * HOW TO ADD A NEW EVENT:
 * 1. Add the key to ANALYTICS_EVENTS.
 * 2. Add its payload shape to AnalyticsEventPayloads.
 * 3. Add its category to EVENT_CATEGORY_MAP.
 * 4. Call trackInteraction(ANALYTICS_EVENTS.YOUR_NEW_EVENT, payload) in components.
 */

// ---------------------------------------------------------------------------
// 1. EVENT REGISTRY — The only place event names are declared.
//    Import this object everywhere. Never write raw string event names.
// ---------------------------------------------------------------------------
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
} as const;

// Derive the union type from the registry values
export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

// ---------------------------------------------------------------------------
// 2. CATEGORY MAP — Maps every event to its GA4 event_category.
//    Centralised so renaming a category is a one-line change.
// ---------------------------------------------------------------------------
export const EVENT_CATEGORY_MAP: Record<AnalyticsEventName, string> = {
  [ANALYTICS_EVENTS.NAV_CLICK]:       "Navigation",
  [ANALYTICS_EVENTS.SOCIAL_CLICK]:    "Social",
  [ANALYTICS_EVENTS.RESUME_VIEW]:     "Resume",
  [ANALYTICS_EVENTS.RESUME_DOWNLOAD]: "Resume",
  [ANALYTICS_EVENTS.PROJECT_VIEW]:    "Projects",
  [ANALYTICS_EVENTS.PROJECT_CLICK]:   "Projects",
  [ANALYTICS_EVENTS.CONTACT_SUBMIT]:  "Contact",
  [ANALYTICS_EVENTS.PAGE_END_REACHED]:"Engagement",
  [ANALYTICS_EVENTS.BLOG_VIEW]:       "Blog",
};

// ---------------------------------------------------------------------------
// 3. PAYLOAD TYPES — TypeScript enforces the correct payload per event.
//    If you call trackInteraction with wrong params, it's a compile error.
// ---------------------------------------------------------------------------
export interface AnalyticsEventPayloads {
  [ANALYTICS_EVENTS.NAV_CLICK]:       { label: string; href: string; location: "navbar" | "footer" };
  [ANALYTICS_EVENTS.SOCIAL_CLICK]:    { platform: string; href: string };
  [ANALYTICS_EVENTS.RESUME_VIEW]:     { label?: string };
  [ANALYTICS_EVENTS.RESUME_DOWNLOAD]: { label?: string };
  [ANALYTICS_EVENTS.PROJECT_VIEW]:    { projectName: string };
  [ANALYTICS_EVENTS.PROJECT_CLICK]:   { projectName: string; linkType: "live" | "repo" };
  [ANALYTICS_EVENTS.CONTACT_SUBMIT]:  { status: "success" | "error"; message?: string };
  [ANALYTICS_EVENTS.PAGE_END_REACHED]:{ label?: string };
  [ANALYTICS_EVENTS.BLOG_VIEW]:       { title: string; slug: string; tags?: string[] };
}

// ---------------------------------------------------------------------------
// 4. LABEL RESOLVER — Derives the primary GA4 event_label from the payload.
//    Keeps this logic in one place instead of scattered across components.
// ---------------------------------------------------------------------------
const resolveLabel = (
  eventName: AnalyticsEventName,
  payload: Record<string, any>
): string | undefined => {
  switch (eventName) {
    case ANALYTICS_EVENTS.NAV_CLICK:
      return payload.label;
    case ANALYTICS_EVENTS.SOCIAL_CLICK:
      return payload.platform;
    case ANALYTICS_EVENTS.RESUME_VIEW:
    case ANALYTICS_EVENTS.RESUME_DOWNLOAD:
      return payload.label ?? "Hero Resume Button";
    case ANALYTICS_EVENTS.PROJECT_VIEW:
    case ANALYTICS_EVENTS.PROJECT_CLICK:
      return payload.projectName;
    case ANALYTICS_EVENTS.CONTACT_SUBMIT:
      return payload.status;
    case ANALYTICS_EVENTS.PAGE_END_REACHED:
      return payload.label ?? "Reached Footer";
    case ANALYTICS_EVENTS.BLOG_VIEW:
      return payload.title;
    default:
      return undefined;
  }
};

// ---------------------------------------------------------------------------
// 5. LOW-LEVEL ENGINE — Not for component use. Called only by trackInteraction.
// ---------------------------------------------------------------------------
const trackEvent = (
  action: string,
  category: string,
  label: string | undefined,
  payload: Record<string, any>
) => {
  if (typeof window === "undefined") return;

  // Push to GTM dataLayer
  if (!(window as any).dataLayer) {
    (window as any).dataLayer = [];
  }
  (window as any).dataLayer.push({
    event: action,
    event_category: category,
    event_label: label,
    ...payload,
  });

  // Also send directly to GA4 via gtag if present (direct-GA4 mode)
  if (typeof (window as any).gtag === "function") {
    (window as any).gtag("event", action, {
      event_category: category,
      event_label: label,
      ...payload,
    });
  }

  if (process.env.NODE_ENV === "development") {
    console.info("[Analytics]", { action, category, label, ...payload });
  }
};

// ---------------------------------------------------------------------------
// 6. PUBLIC API — The only function components should import and call.
// ---------------------------------------------------------------------------
export const trackInteraction = <T extends AnalyticsEventName>(
  eventName: T,
  payload: AnalyticsEventPayloads[T]
): void => {
  const category = EVENT_CATEGORY_MAP[eventName];
  const label = resolveLabel(eventName, payload as Record<string, any>);
  trackEvent(eventName, category, label, payload as Record<string, any>);
};

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;
