import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { PageHero } from "@/components/layout/PageHero";
import { Placeholder } from "@/components/home/Placeholder";
import { JsonLd, breadcrumbJsonLd, pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Gifts by Occasion", description: "Handcrafted gifts for weddings, Diwali, housewarmings, anniversaries, birthdays and corporate occasions.", path: "/gifting/occasions" });
const occasions = [
  { label: "Weddings", blurb: "Heirlooms for the couple and the families.", href: "/collections/heirloom-edit", tone: "wine" },
  { label: "Diwali", blurb: "Diyas, trays and festive tables.", href: "/collections/festive-table", tone: "brass" },
  { label: "Housewarming", blurb: "Warm, earthen pieces for a new home.", href: "/collections/earth-and-clay", tone: "clay" },
  { label: "Anniversaries", blurb: "Objects made to be kept for decades.", href: "/collections/heirloom-edit", tone: "ink" },
  { label: "Birthdays", blurb: "Thoughtful, giftable, ready to wrap.", href: "/collections/gifting-edit", tone: "sand" },
  { label: "Corporate", blurb: "Branded gifts at any quantity.", href: "/gifting/corporate", tone: "ink" },
] as const;

export default function Occasions() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Gifting", path: "/gifting" }, { name: "Occasions", path: "/gifting/occasions" }])} />
      <PageHero eyebrow="Gift with intention" title="Shop by occasion" />
      <Container className="py-20"><ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {occasions.map((o, i) => <li key={o.label}><Reveal delay={(i % 3) * 0.08}>
          <Link href={o.href} className="group relative block aspect-[4/5] overflow-hidden text-ivory">
            <div className="absolute inset-0 transition-transform duration-[1200ms] ease-[var(--ease-luxe)] group-hover:scale-[1.06]"><Placeholder tone={o.tone} label={o.label} pad="px-[10%] pt-[8%] pb-[40%]" /></div>
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-charcoal/90 via-charcoal/60 to-transparent" aria-hidden />
            <div className="absolute inset-x-0 bottom-0 p-7"><h2 className="font-serif text-4xl">{o.label}</h2><p className="mt-2 text-sm text-ivory/80">{o.blurb}</p></div>
          </Link></Reveal></li>)}
      </ul></Container>
    </>
  );
}
