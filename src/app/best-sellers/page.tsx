import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog/CatalogView";
import type { SP } from "@/lib/catalog-params";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Best Sellers", description: "The pieces our customers return to again and again.", alternates: { canonical: "/best-sellers" } };

export default async function Page({ searchParams }: PageProps<"/best-sellers">) {
  const sp = (await searchParams) as SP;
  return <CatalogView eyebrow="Loved most" title="Best Sellers" intro="The pieces our customers return to again and again." scope={{ flag: "bestseller" }} sp={sp} defaultSort="best_selling" crumbs={[{ label: "Home", href: "/" }, { label: "Best Sellers" }]} />;
}
