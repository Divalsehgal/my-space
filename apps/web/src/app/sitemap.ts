import { MetadataRoute } from "next";
import { getNotionPosts } from "@/lib/services/notion";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://divalsehgal.vercel.app";

  // Dynamic routes (Blogs)
  const posts = await getNotionPosts();
  const blogUrls = posts.map((post) => ({
    url: `${baseUrl}/blogs/${post.slug}`,
    lastModified: new Date(post.date || Date.now()),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Static routes
  const staticUrls = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/blogs`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
  ];

  return [...staticUrls, ...blogUrls];
}
