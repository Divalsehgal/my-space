/** Time units, so durations read as what they are (`7 * MS_PER_DAY`) instead of bare numbers. */
export const MS_PER_SECOND = 1000;
export const SECONDS_PER_MINUTE = 60;
export const MINUTES_PER_HOUR = 60;
export const HOURS_PER_DAY = 24;
export const DAYS_PER_WEEK = 7;
/** Calendar-average month, for coarse "N months ago" style labels. */
export const DAYS_PER_MONTH = 30;
export const DAYS_PER_YEAR = 365;

export const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * MINUTES_PER_HOUR;
export const SECONDS_PER_DAY = SECONDS_PER_HOUR * HOURS_PER_DAY;
export const SECONDS_PER_YEAR = SECONDS_PER_DAY * DAYS_PER_YEAR;

export const MS_PER_MINUTE = MS_PER_SECOND * SECONDS_PER_MINUTE;
export const MS_PER_HOUR = MS_PER_MINUTE * MINUTES_PER_HOUR;
export const MS_PER_DAY = MS_PER_HOUR * HOURS_PER_DAY;
