import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog/CatalogView";
import type { SP } from "@/lib/catalog-params";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "New Arrivals", description: "Fresh from the workshops — the newest additions to the house.", alternates: { canonical: "/new-arrivals" } };

export default async function Page({ searchParams }: PageProps<"/new-arrivals">) {
  const sp = (await searchParams) as SP;
  return <CatalogView eyebrow="Just in" title="New Arrivals" intro="Fresh from the workshops — the newest additions to the house." scope={{ flag: "new" }} sp={sp} defaultSort="newest" crumbs={[{ label: "Home", href: "/" }, { label: "New Arrivals" }]} />;
}
