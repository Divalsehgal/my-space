import { MetadataRoute } from "next";
import { getNotionPosts } from "@/lib/services/notion";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://divalsehgal.vercel.app";

  // Dynamic routes (Blogs)
  const posts = await getNotionPosts();
  const blogUrls = posts.map((post) => ({
    url: `${baseUrl}/blogs/${post.slug}`,
    lastModified: new Date(post.date || Date.now()),
  }));

  // Static routes
  const staticUrls = [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/blogs`,
      lastModified: new Date(),
    },
  ];

  return [...staticUrls, ...blogUrls];
}
