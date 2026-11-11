import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Price } from "@/components/ui/Price";
import { Notice } from "@/components/ui/Field";
import { PayPanel } from "@/components/checkout/PayPanel";
import { ProductArt } from "@/components/product/ProductArt";
import { getUser } from "@/server/auth";
import { all } from "@/server/db";
import { authorizeOrderView, getOrderByNumber, getOrderEvents, getOrderItems, parseAddress } from "@/server/orders";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/server/types";
import { dateFmt } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your Order", robots: { index: false, follow: false } };

const STEPS: OrderStatus[] = ["confirmed", "processing", "shipped", "out_for_delivery", "delivered"];

export default async function OrderPage({ params, searchParams }: PageProps<"/order/[number]">) {
  const { number } = await params;
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : undefined;
  const order = getOrderByNumber(number);
  const user = await getUser();
  if (!order || !authorizeOrderView(order, { userId: user?.id, token, staff: user?.role === "admin" || user?.role === "staff" })) notFound();

  const items = getOrderItems(order.id), events = getOrderEvents(order.id);
  const ship = parseAddress(order.shipping_address);
  const paid = order.payment_status === "paid" || order.payment_status === "partially_refunded" || order.payment_status === "refunded";
  const cancelled = order.status === "cancelled";
  const catSlug = new Map(all<{ id: number; s: string | null }>("SELECT p.id, c.slug AS s FROM products p LEFT JOIN categories c ON c.id = p.category_id").map((r) => [r.id, r.s]));
  const stepIdx = STEPS.indexOf(order.status);

  return (
    <Container className="py-12 lg:py-20">
      <div className="mx-auto max-w-3xl">
        {paid && !cancelled ? (
          <div className="text-center"><CheckCircle2 size={44} strokeWidth={1.2} className="mx-auto text-green-800" /><p className="eyebrow mt-5">Thank you</p><h1 className="mt-2 text-[length:var(--text-h1)]">Your order is confirmed</h1><p className="mt-4 text-charcoal/70">Order <strong>{order.number}</strong> · a confirmation has been sent to {order.email}.</p></div>
        ) : cancelled ? (
          <div className="text-center"><h1 className="text-[length:var(--text-h1)]">Order cancelled</h1><p className="mt-4 text-charcoal/70">Order {order.number} was cancelled{order.payment_status === "pending" ? " because payment wasn't completed in time" : ""}. If you were charged, a refund will follow shortly.</p><Button href="/shop" className="mt-6">Continue shopping</Button></div>
        ) : (
          <div className="text-center"><Clock size={40} strokeWidth={1.2} className="mx-auto text-champagne-deep" /><p className="eyebrow mt-5">Almost there</p><h1 className="mt-2 text-[length:var(--text-h1)]">Awaiting payment</h1><p className="mt-4 text-charcoal/70">Order <strong>{order.number}</strong></p></div>
        )}

        {!paid && !cancelled && token && (
          <div className="mt-10"><PayPanel number={order.number} token={token} amount={order.total} email={order.email} phone={order.phone} auto={sp.pay === "1"} failed={order.payment_status === "failed"} /></div>
        )}
        {!paid && !cancelled && !token && <div className="mt-10"><Notice>Sign in to the account that placed this order, or use the link from your email, to complete payment.</Notice></div>}

        {paid && !cancelled && stepIdx >= 0 && (
          <ol className="mt-12 grid grid-cols-5 gap-2 text-center text-[0.65rem] uppercase tracking-[0.12em] sm:text-xs" aria-label="Order progress">
            {STEPS.map((s, i) => (<li key={s} className={i <= stepIdx ? "text-charcoal" : "text-charcoal/35"}><span className={`mx-auto mb-2 block h-1.5 ${i <= stepIdx ? "bg-burgundy" : "bg-charcoal/15"}`} />{ORDER_STATUS_LABEL[s]}</li>))}
          </ol>
        )}
        {order.tracking_number && <p className="mt-6 text-center text-sm">Tracking: <strong>{order.tracking_number}</strong>{order.carrier ? ` · ${order.carrier}` : ""}</p>}

        <section className="mt-12 border border-charcoal/10">
          <h2 className="border-b border-charcoal/10 p-5 font-serif text-2xl">Items</h2>
          <ul className="divide-y divide-charcoal/10 px-5">
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-4 py-4">
                <span className="relative h-20 w-16 shrink-0 overflow-hidden">{i.image ? <img src={i.image} alt="" className="h-full w-full object-contain" /> : <ProductArt tone={(i.tone ?? "sand") as "sand"} kind={i.kind === "giftcard" ? "default" : (i.product_id ? catSlug.get(i.product_id) : null) ?? "default"} />}</span>
                <div className="flex-1 text-sm"><p className="font-serif text-lg leading-tight">{i.name}</p>{i.variant_label && <p className="text-xs text-charcoal/60">{i.variant_label}</p>}<p className="text-xs text-charcoal/60">Qty {i.qty}</p></div>
                <p className="text-sm"><Price inr={i.price * i.qty} /></p>
              </li>
            ))}
          </ul>
          <dl className="space-y-1.5 border-t border-charcoal/10 p-5 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd><Price inr={order.subtotal} /></dd></div>
            {order.discount > 0 && <div className="flex justify-between"><dt>Discount {order.coupon_code && `(${order.coupon_code})`}</dt><dd>−<Price inr={order.discount} /></dd></div>}
            <div className="flex justify-between"><dt>Shipping</dt><dd>{order.shipping === 0 ? "Free" : <Price inr={order.shipping} />}</dd></div>
            {order.gift_wrap_fee > 0 && <div className="flex justify-between"><dt>Gift wrapping</dt><dd><Price inr={order.gift_wrap_fee} /></dd></div>}
            {order.gift_card_used > 0 && <div className="flex justify-between"><dt>Gift card</dt><dd>−<Price inr={order.gift_card_used} /></dd></div>}
            {order.points_used > 0 && <div className="flex justify-between"><dt>Loyalty points</dt><dd>−{order.points_used} pts</dd></div>}
            <div className="flex justify-between border-t border-charcoal/10 pt-3 font-serif text-2xl"><dt>Total</dt><dd><Price inr={order.total} /></dd></div>
            <p className="text-right text-xs text-charcoal/55">Includes ₹{order.tax.toLocaleString("en-IN")} GST</p>
          </dl>
        </section>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <section className="border border-charcoal/10 p-5 text-sm"><h2 className="font-serif text-xl">Shipping to</h2><p className="mt-2 leading-relaxed">{ship.name}<br />{ship.line1}{ship.line2 ? `, ${ship.line2}` : ""}<br />{ship.city}, {ship.state} {ship.pincode}<br />{ship.country}<br />{order.phone}</p></section>
          <section className="border border-charcoal/10 p-5 text-sm"><h2 className="font-serif text-xl">Timeline</h2><ul className="mt-2 space-y-2">{events.map((e) => <li key={e.id}><span className="text-xs text-charcoal/55">{dateFmt(e.created_at)}</span><br />{e.note ?? ORDER_STATUS_LABEL[e.status as OrderStatus] ?? e.status}</li>)}</ul></section>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          {user ? <Button href={`/account/orders/${order.number}`}>View in my account</Button> : paid && <Button href={`/register`} variant="outline">Create an account to track orders</Button>}
          <Button href="/shop" variant={user ? "outline" : "primary"}>Continue shopping</Button>
        </div>
        <p className="mt-6 text-center text-xs text-charcoal/55">Questions? <Link href="/contact" className="underline">Contact us</Link> with your order number.</p>
      </div>
    </Container>
  );
}
