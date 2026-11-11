/* eslint-disable react/no-unescaped-entities */
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { Prose } from "@/components/content/Prose";
import { getSettings } from "@/server/settings";
import { JsonLd, breadcrumbJsonLd, faqJsonLd, pageMeta } from "@/lib/seo";
import { inr } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = pageMeta({ title: "Shipping & Delivery", description: "Shipping rates, delivery timelines and international delivery for handcrafted Nazi Creation orders.", path: "/help/shipping" });

export default function Shipping() {
  const s = getSettings();
  const faq = [
    { q: "How long does delivery take?", a: "Most orders within India arrive in 4–9 working days depending on your PIN code. Express delivery shortens this by about two days." },
    { q: "When is shipping free?", a: `Standard shipping within India is free on orders of ${inr(Number(s.free_shipping_threshold))} or more.` },
    { q: "Do you ship internationally?", a: s.international_enabled === "1" ? `Yes, at a flat rate of ${inr(Number(s.shipping_international))} per order. Customs duties are the buyer's responsibility.` : "International shipping is not available at the moment." },
  ];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Help", path: "/help" }, { name: "Shipping", path: "/help/shipping" }])} /><JsonLd data={faqJsonLd(faq)} />
      <PageHero eyebrow="Help" title="Shipping & delivery" />
      <Container className="py-16"><Prose>
        <h2 className="!mt-0">Rates within India</h2>
        <ul><li><strong>Standard</strong> — {inr(Number(s.shipping_standard))}, free on orders of {inr(Number(s.free_shipping_threshold))} or more.</li><li><strong>Express</strong> — {inr(Number(s.shipping_express))} ({inr(Number(s.shipping_express) - Number(s.shipping_standard))} extra on free-shipping orders).</li></ul>
        <h2>Delivery timelines</h2>
        <p>Each piece is checked and packed by hand, so orders are dispatched within 1–3 working days. Delivery then takes about 4–9 working days by PIN code. You can check an estimate on any product page. You'll receive an email with tracking details once your order ships.</p>
        <h2>International orders</h2>
        <p>{s.international_enabled === "1" ? `We ship worldwide at a flat rate of ${inr(Number(s.shipping_international))} per order. Delivery typically takes 7–14 working days. Import duties and taxes, if any, are charged by your local customs authority and are not included in our prices.` : "We don't currently ship internationally. Please check back soon."}</p>
        <h2>Packaging</h2>
        <p>We use recycled, plastic-free packing. Fragile items such as terracotta are double-boxed.</p>
        <h2>Damaged in transit?</h2>
        <p>Contact us within 48 hours with a photo of the parcel and the piece and we'll arrange a replacement or refund.</p>
        <h2>Frequently asked</h2>
        {faq.map((f) => <div key={f.q}><h3>{f.q}</h3><p>{f.a}</p></div>)}
      </Prose></Container>
    </>
  );
}
