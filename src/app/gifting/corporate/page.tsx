/* eslint-disable react/no-unescaped-entities */
import { Check } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { EnquiryForm } from "@/components/content/EnquiryForm";
import { JsonLd, breadcrumbJsonLd, pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Corporate Gifting", description: "Custom-branded corporate gifts, bulk quantities and curated hampers handcrafted in India. Logo engraving and printing available.", path: "/gifting/corporate" });
const perks = ["Custom logo engraving, printing or stamping", "Bulk quantities from 25 to 5,000+ pieces", "Curated hampers by budget and theme", "Personalised message cards, one per recipient", "Dedicated account manager and sample pieces", "Delivery across India and international shipping"];

export default function Corporate() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Gifting", path: "/gifting" }, { name: "Corporate", path: "/gifting/corporate" }])} />
      <PageHero eyebrow="Corporate gifting" title="Gifts your clients will keep." intro="Handcrafted objects with a story — far more memorable than a branded mug. Tell us about your occasion and we'll prepare a proposal within one working day." />
      <Container className="grid gap-16 py-20 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <h2 className="font-serif text-3xl">What's included</h2>
          <ul className="mt-6 space-y-4">{perks.map((p) => <li key={p} className="flex gap-3 text-sm leading-relaxed"><Check size={18} className="mt-0.5 shrink-0 text-champagne-deep" aria-hidden />{p}</li>)}</ul>
          <p className="mt-10 text-sm text-charcoal/65">Prefer to order straight away? See <a className="underline" href="/gifting/bulk">bulk orders</a> or <a className="underline" href="/gifting/hampers">build a hamper</a>.</p>
        </div>
        <div><h2 className="mb-6 font-serif text-3xl">Request a proposal</h2><EnquiryForm kind="corporate" submitLabel="Request a proposal" messageLabel="Occasion, recipients, ideas" /></div>
      </Container>
    </>
  );
}
