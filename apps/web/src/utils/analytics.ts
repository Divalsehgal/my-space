/**
 * Google Analytics Event Tracking Utility
 */

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

// Define payload types for better DX and type safety
export interface AnalyticsEventPayloads {
  nav_click: { label: string; href: string; location: "navbar" | "footer" };
  social_click: { platform: string; href: string };
  resume_view: { label?: string };
  resume_download: { label?: string };
  project_view: { projectName: string };
  project_click: { projectName: string; linkType: string };
  contact_submit: { status: "success" | "error"; message?: string };
  page_end_reached: { label?: string };
}

/**
 * Low-level track event helper (base for all analytics)
 */
export const trackEvent = (
  action: string,
  category: string,
  params: {
    label?: string;
    value?: number;
    additionalParams?: Record<string, any>;
  } = {}
) => {
  const { label, value, additionalParams } = params;
  
  if (typeof window !== "undefined") {
    // Standard dataLayer push
    const dataLayer = (window as any).dataLayer || [];
    if (!(window as any).dataLayer) {
      (window as any).dataLayer = dataLayer;
    }
    
    dataLayer.push({
      event: action,
      event_category: category,
      event_label: label,
      value: value,
      ...additionalParams,
    });

    // Also call gtag if available
    if ((window as any).gtag) {
      (window as any).gtag("event", action, {
        event_category: category,
        event_label: label,
        value: value,
        ...additionalParams,
      });
    }
  }

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.info("[Analytics Event]", { action, category, label, value, ...additionalParams });
  }
};

/**
 * Tracks a generic user interaction with standard category
 */
export const trackInteraction = <T extends keyof AnalyticsEventPayloads>(
  eventName: T,
  ...args: AnalyticsEventPayloads[T] extends undefined ? [payload?: undefined] : [payload: AnalyticsEventPayloads[T]]
) => {
  const payload = args[0] as any;
  let category = "General";
  let label: string | undefined = undefined;

  switch (eventName) {
    case "nav_click":
      category = "Navigation";
      label = payload?.label;
      break;
    case "social_click":
      category = "Social";
      label = payload?.platform;
      break;
    case "resume_view":
    case "resume_download":
      category = "Resume";
      label = payload?.label || "Hero Resume Button";
      break;
    case "project_view":
    case "project_click":
      category = "Projects";
      label = payload?.projectName;
      break;
    case "page_end_reached":
      category = "Engagement";
      label = payload?.label || "Reached Footer";
      break;
  }

  trackEvent(eventName, category, { label, additionalParams: payload });
};
