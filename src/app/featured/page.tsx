import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog/CatalogView";
import type { SP } from "@/lib/catalog-params";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Featured Products", description: "Our editors' picks of the season.", alternates: { canonical: "/featured" } };

export default async function Page({ searchParams }: PageProps<"/featured">) {
  const sp = (await searchParams) as SP;
  return <CatalogView eyebrow="Hand-picked" title="Featured Products" intro="Our editors' picks of the season." scope={{ flag: "featured" }} sp={sp} defaultSort="featured" crumbs={[{ label: "Home", href: "/" }, { label: "Featured Products" }]} />;
}
