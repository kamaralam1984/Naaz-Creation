import Link from "next/link";
import { ArrowRight, Building2, Gift, Package, PartyPopper, Ticket } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { PageHero } from "@/components/layout/PageHero";
import { JsonLd, breadcrumbJsonLd, pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Gifting", description: "Corporate gifting, custom hampers, bulk orders, gift cards and gifts by occasion — handcrafted in India and beautifully packed.", path: "/gifting" });

const tiles = [
  { icon: Building2, title: "Corporate gifting", body: "Client, employee and event gifts with custom logo engraving.", href: "/gifting/corporate" },
  { icon: Package, title: "Custom hampers", body: "Build a hamper from our pieces, tailored to occasion and budget.", href: "/gifting/hampers" },
  { icon: PartyPopper, title: "Shop by occasion", body: "Weddings, Diwali, housewarmings and more.", href: "/gifting/occasions" },
  { icon: Gift, title: "Bulk orders", body: "Wholesale and event quantities at considered pricing.", href: "/gifting/bulk" },
  { icon: Ticket, title: "Gift cards", body: "Instant email delivery, valid for 12 months.", href: "/gift-cards" },
];

export default function Gifting() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Gifting", path: "/gifting" }])} />
      <PageHero eyebrow="Gifting" title="Gifts that carry a story." intro="Each piece comes with its maker's story card, packed in plastic-free materials — ready to be given." />
      <Container className="py-20">
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {tiles.map(({ icon: Icon, title, body, href }, i) => (
            <li key={title}><Reveal delay={(i % 3) * 0.08}>
              <Link href={href} className="group flex h-full flex-col border border-charcoal/15 bg-beige/40 p-8 transition-shadow hover:shadow-[var(--shadow-lift)]">
                <Icon size={30} strokeWidth={1.2} className="text-champagne-deep" aria-hidden />
                <h2 className="mt-6 font-serif text-3xl">{title}</h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-charcoal/75">{body}</p>
                <span className="mt-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em]">Explore <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" aria-hidden /></span>
              </Link>
            </Reveal></li>
          ))}
        </ul>
      </Container>
    </>
  );
}
