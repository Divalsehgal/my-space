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
