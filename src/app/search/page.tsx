import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog/CatalogView";
import type { SP } from "@/lib/catalog-params";

export const dynamic = "force-dynamic";
export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const q = (await searchParams).q;
  return { title: q ? `Search: ${String(q).slice(0, 60)}` : "Search", robots: { index: false, follow: true } };
}
export default async function Page({ searchParams }: PageProps<"/search">) {
  const sp = (await searchParams) as SP;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim() ?? "";
  return <CatalogView eyebrow="Search" title={q ? `Results for “${q.slice(0, 60)}”` : "Search the house"} scope={{}} sp={sp} defaultSort="relevance" crumbs={[{ label: "Home", href: "/" }, { label: "Search" }]} emptyHint="Check the spelling, try a more general term, or browse a category below." />;
}
