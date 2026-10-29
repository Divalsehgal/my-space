export const SITE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "https://divalsehgal.vercel.app").replace(/\/$/, "");

export const AUTHOR = {
  name: "Dival Sehgal",
  jobTitle: "Senior Software Engineer",
  image: "/me.avif",
} as const;

/** Stable JSON-LD ids, so every page's structured data links to one entity. */
export const PERSON_ID = `${SITE_URL}/#person`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const BLOG_ID = `${SITE_URL}/blogs#blog`;
