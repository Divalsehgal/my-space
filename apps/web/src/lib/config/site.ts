export const SITE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "https://divalsehgal.vercel.app").replace(/\/$/, "");

export const AUTHOR = {
  name: "Dival Sehgal",
  jobTitle: "Senior Software Engineer",
  image: "/me.avif",
} as const;
