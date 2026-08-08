/**
 * Formats an ISO date string to a localized string.
 * @param dateString The ISO date string to format
 * @param options Intl.DateTimeFormatOptions for formatting (defaults to "long" month, "numeric" day/year)
 * @param locale The locale to use (defaults to "en-US")
 * @returns Formatted date string or null if invalid
 */
export function formatDate(
  dateString?: string | null,
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" },
  locale: string = "en-US"
): string | null {
  if (!dateString) {return null;}

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {return null;}
    return date.toLocaleDateString(locale, options);
  } catch (error) {
    console.error("Failed to format date:", dateString, error);
    return null;
  }
}

function pluralize(value: number, unit: string): string {
  return `${value} ${unit}${value === 1 ? "" : "s"} ago`;
}

/**
 * Formats a date into a human-friendly relative label that scales its unit
 * (days → weeks → months → years) based on how long ago the date was.
 *
 * Examples: "Last updated today", "Published 3 days ago",
 * "Last updated 2 weeks ago", "Published 5 months ago", "Last updated 1 year ago".
 *
 * @param dateString The ISO date string to describe
 * @param isUpdated When true, prefixes with "Last updated"; otherwise "Published"
 * @returns The relative label or null if the date is missing/invalid
 */
export function getRelativeTimeLabel(
  dateString?: string | null,
  isUpdated = false,
): string | null {
  if (!dateString) {
    return null;
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const diffInDays = Math.floor(
    (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24),
  );
  const prefix = isUpdated ? "Last updated" : "Published";

  if (diffInDays <= 0) {
    return `${prefix} today`;
  }

  if (diffInDays < 7) {
    return `${prefix} ${pluralize(diffInDays, "day")}`;
  }

  if (diffInDays < 30) {
    return `${prefix} ${pluralize(Math.floor(diffInDays / 7), "week")}`;
  }

  if (diffInDays < 365) {
    return `${prefix} ${pluralize(Math.floor(diffInDays / 30), "month")}`;
  }

  return `${prefix} ${pluralize(Math.floor(diffInDays / 365), "year")}`;
}
