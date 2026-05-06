import { MetadataRoute } from "next";
import { generateSitemap } from "@/lib/services/seo";

// Sitemap revalidates automatically via 'contentful' tag when posts are published

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return generateSitemap();
}
