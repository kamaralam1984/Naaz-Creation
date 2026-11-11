import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog/CatalogView";
import type { SP } from "@/lib/catalog-params";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "All Products", description: "Every handcrafted piece in the house — filter by craft, material or colour.", alternates: { canonical: "/shop" } };

export default async function Page({ searchParams }: PageProps<"/shop">) {
  const sp = (await searchParams) as SP;
  return <CatalogView eyebrow="The collection" title="All Products" intro="Every handcrafted piece in the house — filter by craft, material or colour." scope={{}} sp={sp} defaultSort="featured" crumbs={[{ label: "Home", href: "/" }, { label: "All Products" }]} />;
}
