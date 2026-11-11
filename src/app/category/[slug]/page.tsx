import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/catalog/CatalogView";
import { JsonLdBreadcrumb } from "@/components/product/JsonLd";
import { getCategory } from "@/server/catalog";
import type { SP } from "@/lib/catalog-params";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const c = getCategory((await params).slug);
  if (!c) return {};
  return { title: c.name, description: c.description ?? undefined, alternates: { canonical: `/category/${c.slug}` }, openGraph: { title: c.name, description: c.description ?? undefined } };
}
export default async function Page({ params, searchParams }: PageProps<"/category/[slug]">) {
  const { slug } = await params;
  const c = getCategory(slug);
  if (!c) notFound();
  const crumbs = [{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, { label: c.name }];
  return (<><JsonLdBreadcrumb items={crumbs.map((x) => ({ name: x.label, href: x.href ?? `/category/${c.slug}` }))} /><CatalogView eyebrow="Shop by category" title={c.name} intro={c.description ?? undefined} scope={{ category: [c.slug] }} sp={(await searchParams) as SP} crumbs={crumbs} /></>);
}
