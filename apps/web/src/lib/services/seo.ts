import { MetadataRoute } from "next";
import { getNotionPosts } from "@/lib/services/notion";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://divalsehgal.vercel.app";

export async function generateSitemap(): Promise<MetadataRoute.Sitemap> {
  // Dynamic routes (Blogs)
  const posts = await getNotionPosts();
  const blogUrls = posts.map((post) => ({
    url: `${BASE_URL}/blogs/${post.slug}`,
    lastModified: new Date(post.date || Date.now()),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Static routes
  const staticUrls = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/blogs`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
  ];

  return [...staticUrls, ...blogUrls];
}

export function generateRobots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/private/",
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
