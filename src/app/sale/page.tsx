import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog/CatalogView";
import type { SP } from "@/lib/catalog-params";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sale", description: "Handcrafted pieces at special prices, while stocks last.", alternates: { canonical: "/sale" } };

export default async function Page({ searchParams }: PageProps<"/sale">) {
  const sp = (await searchParams) as SP;
  return <CatalogView eyebrow="Offers" title="Sale" intro="Handcrafted pieces at special prices, while stocks last." scope={{ flag: "sale" }} sp={sp} defaultSort="featured" crumbs={[{ label: "Home", href: "/" }, { label: "Sale" }]} />;
}
