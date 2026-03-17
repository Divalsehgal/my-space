
declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const trackEvent = (action: string, category: string, label: string, value?: number) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Analytics Event] action: ${action}, category: ${category}, label: ${label}${value ? `, value: ${value}` : ""}`);
  }

  if (typeof window !== "undefined") {
    // Standard dataLayer push for GTM and GA4
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: action,
      event_category: category,
      event_label: label,
      value: value,
    });

    // Also call gtag if it exists (for direct GA4 implementations)
    if (window.gtag) {
      window.gtag("event", action, {
        event_category: category,
        event_label: label,
        value: value,
      });
    }
  }
};
