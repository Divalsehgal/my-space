import { MetadataRoute } from "next";
import { generateSitemap } from "@/lib/services/seo";

// Revalidate sitemap every 1 hour (ISR)
// Since sitemap includes dynamic blog posts from Notion, we need ISR
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return generateSitemap();
}
