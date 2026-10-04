import { DEFAULT_LOCALE } from "@/i18n/config";
import { createTranslator, type Translate } from "@/i18n/core";
import { DAYS_PER_MONTH, DAYS_PER_WEEK, DAYS_PER_YEAR, MS_PER_DAY } from "@dival-sehgal/utils/time";

/**
 * Formats an ISO date string to a localized string.
 * @param dateString The ISO date string to format
 * @param options Intl.DateTimeFormatOptions for formatting (defaults to "long" month, "numeric" day/year)
 * @param locale The locale to use (defaults to "en-US")
 * @returns Formatted date string or null if invalid
 */
const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };

export function formatDate(
  dateString?: string | null,
  options: Intl.DateTimeFormatOptions = DEFAULT_DATE_OPTIONS,
  locale: string = "en-US"
): string | null {
  if (!dateString) {return null;}

  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {return null;}
    return date.toLocaleDateString(locale, options);
  } catch (error) {
    console.error("Failed to format date:", dateString, error);
    return null;
  }
}

const defaultT = createTranslator();

/**
 * Formats a date into a human-friendly relative label that scales its unit
 * (days → weeks → months → years) based on how long ago the date was.
 *
 * Examples: "Last updated today", "Published 3 days ago",
 * "Last updated 2 weeks ago", "Published 5 months ago", "Last updated 1 year ago".
 *
 * @param dateString The ISO date string to describe
 * @param isUpdated When true, prefixes with "Last updated"; otherwise "Published"
 * @param t Translator for the wrapper text ("Published {when}")
 * @param locale Locale for the relative phrase itself ("3 days ago"), via Intl
 * @returns The relative label or null if the date is missing/invalid
 */
export function getRelativeTimeLabel(
  dateString?: string | null,
  isUpdated = false,
  t: Translate = defaultT,
  locale: string = DEFAULT_LOCALE,
): string | null {
  if (!dateString) {
    return null;
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const diffInDays = Math.floor(
    (Date.now() - date.getTime()) / MS_PER_DAY,
  );
  const wrap = (when: string) => t(isUpdated ? "date.updated" : "date.published", { when });
  if (diffInDays <= 0) {
    return wrap(t("date.today"));
  }

  // "always" keeps "1 day ago" rather than "yesterday", matching the other units.
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: "always" });
  if (diffInDays < DAYS_PER_WEEK) {
    return wrap(relative.format(-diffInDays, "day"));
  }
  if (diffInDays < DAYS_PER_MONTH) {
    return wrap(relative.format(-Math.floor(diffInDays / DAYS_PER_WEEK), "week"));
  }
  if (diffInDays < DAYS_PER_YEAR) {
    return wrap(relative.format(-Math.floor(diffInDays / DAYS_PER_MONTH), "month"));
  }
  return wrap(relative.format(-Math.floor(diffInDays / DAYS_PER_YEAR), "year"));
}
