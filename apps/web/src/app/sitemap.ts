import { MetadataRoute } from "next";
import { generateSitemap } from "@/lib/services/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return generateSitemap();
}
