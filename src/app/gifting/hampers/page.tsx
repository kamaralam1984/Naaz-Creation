import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { HamperBuilder } from "@/components/content/HamperBuilder";
import { listProducts } from "@/server/catalog";
import { JsonLd, breadcrumbJsonLd, pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMeta({ title: "Custom Gift Hampers", description: "Build a custom gift hamper from handcrafted copper, brass, terracotta and wood pieces — tailored to your occasion and budget.", path: "/gifting/hampers" });

export default function Hampers() {
  const { items } = listProducts({ perPage: 24, sort: "featured", inStock: true });
  const mapped = items.filter((p) => p.price <= 6000).map((p) => ({ id: p.id, slug: p.slug, name: p.name, price: p.price, craft: p.craft, tone: p.tone, category: p.category_slug ?? null, image: p.images[0] ?? null }));
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Gifting", path: "/gifting" }, { name: "Custom hampers", path: "/gifting/hampers" }])} />
      <PageHero eyebrow="Custom hampers" title="Build a hamper, your way." intro="Choose an occasion, pick the pieces you love and we'll pack them together with a personalised note." />
      <Container className="py-20"><HamperBuilder items={mapped} /></Container>
    </>
  );
}
