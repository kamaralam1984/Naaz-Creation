import { ARTISAN_IMAGE } from "@/server/catalog-data";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { PageHero } from "@/components/layout/PageHero";
import { Placeholder } from "@/components/home/Placeholder";
import { getArtisans } from "@/server/catalog";
import { JsonLd, breadcrumbJsonLd, pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMeta({ title: "Our Artisans", description: "Meet the Dokra casters, copper smiths, potters, painters and weavers behind every Nazi Creation piece.", path: "/artisans" });

export default function Artisans() {
  const list = getArtisans();
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Artisans", path: "/artisans" }])} />
      <PageHero eyebrow="Meet the makers" title="The hands behind the house" intro="Every piece carries the signature of its maker. These are some of the artisans and cooperatives we work with directly." />
      <Container className="py-20">
        <ul className="grid gap-x-8 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
          {list.map((a, i) => (
            <li key={a.id}><Reveal delay={(i % 3) * 0.08}>
              <Link href={`/artisans/${a.slug}`} className="group block">
                <div className="aspect-[4/5] overflow-hidden"><div className="h-full transition-transform duration-[1200ms] ease-[var(--ease-luxe)] group-hover:scale-[1.05]"><Placeholder tone={a.tone} label={`Portrait of ${a.name}`} src={ARTISAN_IMAGE[a.slug]} pad="p-[10%]" /></div></div>
                <h2 className="mt-5 font-serif text-3xl">{a.name}</h2>
                <p className="text-xs uppercase tracking-[0.18em] text-champagne-deep">{a.craft} · {a.place}</p>
                {a.quote && <p className="mt-3 font-serif text-xl italic leading-snug text-charcoal/75">&ldquo;{a.quote}&rdquo;</p>}
              </Link>
            </Reveal></li>
          ))}
        </ul>
      </Container>
    </>
  );
}
