import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/catalog/CatalogView";
import { getCollection } from "@/server/catalog";
import type { SP } from "@/lib/catalog-params";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const c = getCollection((await params).slug);
  if (!c) return {};
  return { title: c.name, description: c.blurb ?? undefined, alternates: { canonical: `/collections/${c.slug}` } };
}
export default async function Page({ params, searchParams }: PageProps<"/collections/[slug]">) {
  const c = getCollection((await params).slug);
  if (!c) notFound();
  return <CatalogView eyebrow="Collection" title={c.name} intro={c.description ?? c.blurb ?? undefined} scope={{ collection: c.slug }} sp={(await searchParams) as SP} crumbs={[{ label: "Home", href: "/" }, { label: "Collections", href: "/collections" }, { label: c.name }]} />;
}
