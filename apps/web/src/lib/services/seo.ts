import { MetadataRoute } from "next";
import { getContentfulPosts } from "@/lib/services/contentful";
import { SITE_URL as BASE_URL } from "@/lib/config/site";

export async function generateSitemap(): Promise<MetadataRoute.Sitemap> {
  // Dynamic routes (Blogs)
  const posts = await getContentfulPosts();
  const blogUrls = posts.map((post) => ({
    url: `${BASE_URL}/blogs/${post.slug}`,
    lastModified: new Date(post.publishedAt || post.date || Date.now()),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Listing pages change when a post does. Using the build time instead made
  // every lastmod "now" on each deploy, which teaches Google to ignore them.
  const latestPostTime = Math.max(0, ...blogUrls.map((entry) => entry.lastModified.getTime()));
  const contentUpdated = latestPostTime ? new Date(latestPostTime) : undefined;

  // Static routes
  const staticUrls = [
    {
      url: BASE_URL,
      lastModified: contentUpdated,
      changeFrequency: "monthly" as const,
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/blogs`,
      lastModified: contentUpdated,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/architecture`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
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
