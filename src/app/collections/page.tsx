import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { Placeholder } from "@/components/home/Placeholder";
import { Reveal } from "@/components/ui/Reveal";
import { getCollections } from "@/server/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Collections", description: "Curated edits of handcrafted décor, gifts and heirlooms.", alternates: { canonical: "/collections" } };

export default function Page() {
  const cols = getCollections();
  return (
    <>
      <PageHero eyebrow="Curated" title="Collections" intro="Edits assembled by our team — pieces that belong together." />
      <Container className="py-14 lg:py-20">
        <ul className="grid gap-6 md:grid-cols-2">
          {cols.map((c, i) => (
            <li key={c.slug}>
              <Reveal delay={(i % 2) * 0.1}>
                <Link href={`/collections/${c.slug}`} className="group relative block aspect-[4/5] overflow-hidden sm:aspect-[4/3] text-ivory">
                  <div className="absolute inset-0 transition-transform duration-[1200ms] ease-[var(--ease-luxe)] group-hover:scale-[1.05]"><Placeholder tone={c.tone} label={c.name} src={c.image ?? undefined} pad="px-[14%] pt-[6%] pb-[46%] sm:px-[16%] sm:pb-[30%]" /></div>
                  <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-charcoal/90 via-charcoal/65 to-transparent" aria-hidden />
                  <div className="absolute inset-x-0 bottom-0 p-8">
                    <p className="eyebrow !text-champagne">{c.count} pieces</p>
                    <h2 className="mt-2 font-serif text-4xl">{c.name}</h2>
                    <p className="mt-2 max-w-sm text-sm text-ivory/80">{c.blurb}</p>
                    <span className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em]">Explore <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></span>
                  </div>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
