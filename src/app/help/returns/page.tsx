/* eslint-disable react/no-unescaped-entities */
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { Prose } from "@/components/content/Prose";
import { getSettings } from "@/server/settings";
import { JsonLd, breadcrumbJsonLd, pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMeta({ title: "Returns & Refunds", description: "Our return window, how to request a return and when refunds reach you.", path: "/help/returns" });

export default function Returns() {
  const days = getSettings().return_window_days;
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Help", path: "/help" }, { name: "Returns", path: "/help/returns" }])} />
      <PageHero eyebrow="Help" title="Returns & refunds" />
      <Container className="py-16"><Prose>
        <h2 className="!mt-0">{days}-day returns</h2>
        <p>If a piece isn't right, you can request a return within <strong>{days} days</strong> of delivery. Items must be unused and in original packaging.</p>
        <h2>How to return</h2>
        <ul><li>Sign in and open <Link href="/account/orders">My orders</Link>.</li><li>Choose the delivered order and select <em>Request return</em> for the item.</li><li>Once approved, we'll arrange a pickup or share return instructions.</li></ul>
        <h2>Refunds</h2>
        <p>After we receive and inspect the piece, your refund is issued to the original payment method and typically reaches you within 5–7 working days. You can follow its status under <Link href="/account/returns">My returns</Link>.</p>
        <h2>Handmade variation</h2>
        <p>Slight variations in colour, texture and form are part of handmade work and are not defects.</p>
        <h2>Not returnable</h2>
        <ul><li>Gift cards</li><li>Custom or personalised pieces</li><li>Items damaged after delivery through misuse</li></ul>
      </Prose></Container>
    </>
  );
}
