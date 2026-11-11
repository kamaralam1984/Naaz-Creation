import { ARTISAN_IMAGE } from "@/server/catalog-data";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/layout/PageHero";
import { Placeholder } from "@/components/home/Placeholder";
import { ProductCard } from "@/components/product/ProductCard";
import { getArtisan, productsByArtisan } from "@/server/catalog";
import { JsonLd, breadcrumbJsonLd, pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = getArtisan((await params).slug);
  if (!a) return { title: "Artisan not found", robots: { index: false } };
  return pageMeta({ title: `${a.name} — ${a.craft}`, description: `${a.bio?.slice(0, 150) ?? `${a.name}, ${a.craft} from ${a.place}.`}`, path: `/artisans/${a.slug}` });
}

export default async function ArtisanPage({ params }: Props) {
  const a = getArtisan((await params).slug);
  if (!a) notFound();
  const products = productsByArtisan(a.id);
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Artisans", path: "/artisans" }, { name: a.name, path: `/artisans/${a.slug}` }])} />
      <Container className="pt-8"><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Artisans", href: "/artisans" }, { label: a.name }]} /></Container>
      <Container className="grid items-center gap-12 py-14 lg:grid-cols-2 lg:py-20">
        <div className="aspect-[4/5]"><Placeholder tone={a.tone} label={`Portrait of ${a.name}`} src={ARTISAN_IMAGE[a.slug]} pad="p-[10%]" /></div>
        <div>
          <p className="eyebrow">{a.craft} · {a.place}</p>
          <h1 className="mt-3 text-[length:var(--text-h1)]">{a.name}</h1>
          {a.quote && <blockquote className="mt-8 border-l-2 border-champagne pl-6 font-serif text-3xl italic leading-snug">&ldquo;{a.quote}&rdquo;</blockquote>}
          {a.bio && <p className="mt-8 max-w-lg leading-relaxed text-charcoal/80">{a.bio}</p>}
          <Button href="/artisans" variant="outline" className="mt-10">All artisans</Button>
        </div>
      </Container>
      <Container className="pb-20">
        <h2 className="font-serif text-4xl">Pieces by {a.name.split(" ")[0]}</h2>
        {products.length ? <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">{products.map((p) => <li key={p.id}><ProductCard p={p} /></li>)}</ul> : <p className="mt-6 text-charcoal/70">New pieces are on their way.</p>}
      </Container>
    </>
  );
}
