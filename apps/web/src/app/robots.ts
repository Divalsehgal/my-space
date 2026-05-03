import { MetadataRoute } from "next";
import { generateRobots } from "@/lib/services/seo";

export default function robots(): MetadataRoute.Robots {
  return generateRobots();
}
