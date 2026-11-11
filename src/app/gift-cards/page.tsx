import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { GiftCardPurchase } from "@/components/content/GiftCardPurchase";
import { BalanceCheck } from "@/components/content/BalanceCheck";
import { getProductBySlug, getVariants } from "@/server/catalog";
import { JsonLd, breadcrumbJsonLd, pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMeta({ title: "Gift Cards", description: "Give the gift of choice. Nazi Creation gift cards are delivered instantly by email and valid for 12 months.", path: "/gift-cards" });

export default function GiftCards() {
  const p = getProductBySlug("gift-card");
  const variants = p ? getVariants(p.id).map((v) => ({ id: v.id, label: v.label, price: v.price ?? p.price })) : [];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Gift cards", path: "/gift-cards" }])} />
      <PageHero eyebrow="Gift cards" title="The gift of choice." intro="Delivered instantly by email with your personal message. Redeemable on anything in the house." />
      <Container className="py-20">
        {p && variants.length ? <GiftCardPurchase productId={p.id} variants={variants} /> : <p className="text-charcoal/70">Gift cards are temporarily unavailable.</p>}
        <div className="mt-24 max-w-2xl border-t border-charcoal/15 pt-12"><h2 className="font-serif text-3xl">Check a balance</h2><p className="mb-6 mt-2 text-sm text-charcoal/70">Enter the code from your gift card email. Redeem it at checkout.</p><BalanceCheck /></div>
      </Container>
    </>
  );
}
