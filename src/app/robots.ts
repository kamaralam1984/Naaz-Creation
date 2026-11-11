import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/api/", "/checkout", "/cart", "/order", "/login", "/register", "/unsubscribe"] }], sitemap: absoluteUrl("/sitemap.xml") };
}
