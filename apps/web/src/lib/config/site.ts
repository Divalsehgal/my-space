export const SITE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "https://divalsehgal.vercel.app").replace(/\/$/, "");

export const AUTHOR = {
  name: "Dival Sehgal",
  jobTitle: "Senior Software Engineer",
  image: "/me.avif",
  bio: "Senior Software Engineer building fast, accessible web apps with Next.js, TypeScript and Node.js. I write about how the web actually works, from the network layer to the UI.",
} as const;
