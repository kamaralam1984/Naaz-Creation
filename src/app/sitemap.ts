import type { MetadataRoute } from "next";
import { all } from "@/server/db";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";
const iso = (s: string | null) => (s ? new Date(s.replace(" ", "T") + "Z") : undefined);

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = ["/", "/shop", "/collections", "/best-sellers", "/new-arrivals", "/sale", "/artisans", "/about", "/gifting", "/gifting/corporate", "/gifting/hampers", "/gifting/occasions", "/gifting/bulk", "/gift-cards", "/contact", "/help", "/help/shipping", "/help/returns", "/help/care", "/legal/privacy", "/legal/terms"];
  const rows = (sql: string, base: string, pri: number): MetadataRoute.Sitemap =>
    all<{ slug: string; m: string | null }>(sql).map((r) => ({ url: absoluteUrl(`${base}/${r.slug}`), lastModified: iso(r.m), changeFrequency: "weekly", priority: pri }));
  return [
    ...staticPaths.map((p) => ({ url: absoluteUrl(p), changeFrequency: "weekly" as const, priority: p === "/" ? 1 : 0.6 })),
    ...rows("SELECT slug, updated_at AS m FROM products WHERE is_active = 1 AND kind = 'physical'", "/product", 0.8),
    ...rows("SELECT slug, NULL AS m FROM categories", "/category", 0.7),
    ...rows("SELECT slug, NULL AS m FROM collections WHERE is_active = 1", "/collections", 0.7),
    ...rows("SELECT slug, NULL AS m FROM artisans", "/artisans", 0.5),
  ];
}
