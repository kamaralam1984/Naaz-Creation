import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth";
import { getOrderByNumber, getOrderEvents, getOrderItems, parseAddress } from "@/server/orders";
import { orderReturns, withinDays } from "@/server/account";
import { getSetting } from "@/server/settings";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/server/types";
import { StatusBadge } from "@/components/admin/ui";
import { ReturnForm } from "@/components/account/AccountForms";
import { ProductArt } from "@/components/product/ProductArt";
import { Button } from "@/components/ui/Button";
import { requestReturnAction } from "../../actions";
import { cn } from "@/lib/cn";
import { dateFmt, inr } from "@/lib/format";

export const metadata: Metadata = { title: "Order details" };
export const dynamic = "force-dynamic";

const STEPS: OrderStatus[] = ["confirmed", "processing", "shipped", "out_for_delivery", "delivered"];

function Addr({ title, raw }: { title: string; raw: string }) {
  const a = parseAddress(raw);
  return (
    <div><p className="eyebrow">{title}</p>
      <address className="mt-2 text-sm not-italic leading-relaxed">{a.name}<br />{a.line1}{a.line2 ? <>, {a.line2}</> : null}<br />{a.city}, {a.state} {a.pincode}<br />{a.country}<br />{a.phone}</address></div>
  );
}

export default async function OrderDetail({ params }: PageProps<"/account/orders/[number]">) {
  const { number } = await params;
  const user = await requireUser(`/account/orders/${number}`);
  const o = getOrderByNumber(number);
  if (!o || o.user_id !== user.id) notFound();
  const items = getOrderItems(o.id);
  const events = getOrderEvents(o.id);
  const returns = orderReturns(o.id);
  const idx = STEPS.indexOf(o.status);
  const closed = ["cancelled", "refunded", "returned"].includes(o.status);
  const needsPay = o.status !== "cancelled" && (o.payment_status === "pending" || o.payment_status === "failed");
  const deliveredAt = events.filter((e) => e.status === "delivered").at(-1)?.created_at ?? o.updated_at;
  const windowDays = Number(getSetting("return_window_days")) || 7;
  const inWindow = o.status === "delivered" && withinDays(deliveredAt, windowDays);

  const rows: [string, string][] = [["Subtotal", inr(o.subtotal)]];
  if (o.discount) rows.push([`Discount${o.coupon_code ? ` (${o.coupon_code})` : ""}`, "−" + inr(o.discount)]);
  rows.push(["Shipping", o.shipping ? inr(o.shipping) : "Free"]);
  if (o.gift_wrap_fee) rows.push(["Gift wrap", inr(o.gift_wrap_fee)]);
  if (o.gift_card_used) rows.push([`Gift card${o.gift_card_code ? ` (${o.gift_card_code})` : ""}`, "−" + inr(o.gift_card_used)]);
  if (o.points_used) rows.push(["Loyalty points", `−${o.points_used} pts`]);
  if (o.tax) rows.push([`GST${getSetting("tax_inclusive") === "1" ? " (included)" : ""}`, inr(o.tax)]);

  return (
    <div className="space-y-10">
      <div>
        <Link href="/account/orders" className="link-underline text-xs uppercase tracking-[0.18em]">← All orders</Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div><h2 className="font-serif text-3xl">{o.number}</h2><p className="text-sm text-charcoal/60">Placed {dateFmt(o.created_at)}</p></div>
          <div className="flex items-center gap-2"><StatusBadge status={o.status} /><StatusBadge status={o.payment_status} /></div>
        </div>
      </div>

      {needsPay && (
        <div className="flex flex-wrap items-center justify-between gap-4 border border-burgundy/40 bg-burgundy/5 p-5">
          <p className="text-sm">{o.payment_status === "failed" ? "Your payment didn't go through." : "This order is awaiting payment."} Complete it to confirm your order.</p>
          <Button href={`/order/${o.number}?token=${o.access_token}`}>{o.payment_status === "failed" ? "Retry payment" : "Pay now"}</Button>
        </div>
      )}

      {!closed && o.payment_status === "paid" && (
        <section aria-label="Delivery progress">
          <ol className="grid grid-cols-5 gap-2">
            {STEPS.map((s, i) => (
              <li key={s} className="text-center">
                <div className={cn("mx-auto flex h-8 w-8 items-center justify-center rounded-full border text-xs", i <= idx ? "border-burgundy bg-burgundy text-ivory" : "border-charcoal/25 text-charcoal/40")}>{i < idx ? "✓" : i + 1}</div>
                <div className={cn("mx-auto -mt-4 mb-4 h-px", i < STEPS.length - 1 ? (i < idx ? "bg-burgundy" : "bg-charcoal/20") : "hidden")} aria-hidden style={{ width: "100%", transform: "translateX(50%)" }} />
                <p className={cn("text-[0.65rem] uppercase tracking-[0.1em] sm:text-xs", i <= idx ? "text-charcoal" : "text-charcoal/45")}>{ORDER_STATUS_LABEL[s]}</p>
              </li>
            ))}
          </ol>
          {(o.tracking_number || o.carrier) && <p className="mt-6 text-sm">{o.carrier && <>Carrier: <strong>{o.carrier}</strong> · </>}{o.tracking_number && <>Tracking no. <strong>{o.tracking_number}</strong></>}</p>}
        </section>
      )}

      <section aria-labelledby="items-h">
        <h3 id="items-h" className="font-serif text-2xl">Items</h3>
        <ul className="mt-4 divide-y divide-charcoal/10 border-y border-charcoal/10">
          {items.map((i) => {
            const ret = returns.find((r) => r.order_item_id === i.id && r.status !== "rejected");
            return (
              <li key={i.id} className="flex gap-4 py-5">
                <div className="h-24 w-20 shrink-0 overflow-hidden">{i.image ? <img src={i.image} alt={i.name} className="h-full w-full object-contain" /> : <ProductArt tone={i.tone ?? "sand"} label={i.name} />}</div>
                <div className="flex-1">
                  <p className="font-serif text-xl leading-tight">{i.name}</p>
                  {i.variant_label && <p className="text-xs text-charcoal/60">{i.variant_label}</p>}
                  <p className="mt-1 text-sm text-charcoal/70">Qty {i.qty} × {inr(i.price)}</p>
                  {ret ? <p className="mt-2 text-xs uppercase tracking-[0.14em] text-champagne-deep">Return {ret.status}</p>
                    : inWindow && i.kind === "physical" ? <div className="mt-2"><ReturnForm action={requestReturnAction} order={o.number} itemId={i.id} /></div> : null}
                </div>
                <p className="text-sm font-medium">{inr(i.price * i.qty)}</p>
              </li>
            );
          })}
        </ul>
        {o.status === "delivered" && !inWindow && <p className="mt-3 text-xs text-charcoal/60">The {windowDays}-day return window for this order has closed.</p>}
      </section>

      <div className="grid gap-10 md:grid-cols-2">
        <section aria-labelledby="sum-h">
          <h3 id="sum-h" className="font-serif text-2xl">Summary</h3>
          <dl className="mt-4 space-y-2 text-sm">
            {rows.map(([k, v]) => <div key={k} className="flex justify-between"><dt className="text-charcoal/70">{k}</dt><dd>{v}</dd></div>)}
            <div className="flex justify-between border-t border-charcoal/15 pt-3 text-base font-medium"><dt>Total</dt><dd>{inr(o.total)}</dd></div>
            <div className="flex justify-between text-xs text-charcoal/60"><dt>Payment</dt><dd className="capitalize">{o.payment_method ?? "—"} · {o.payment_status.replace(/_/g, " ")}</dd></div>
          </dl>
          {o.gift_message && <p className="mt-4 border-l-2 border-champagne pl-3 text-sm italic">“{o.gift_message}”</p>}
        </section>
        <section className="grid gap-6 sm:grid-cols-2"><Addr title="Ship to" raw={o.shipping_address} /><Addr title="Billing" raw={o.billing_address} /></section>
      </div>

      <section aria-labelledby="tl-h">
        <h3 id="tl-h" className="font-serif text-2xl">Timeline</h3>
        <ol className="mt-4 space-y-4 border-l border-charcoal/20 pl-5">
          {[...events].reverse().map((e) => (
            <li key={e.id} className="relative"><span className="absolute -left-[1.55rem] top-1.5 h-2 w-2 rounded-full bg-burgundy" aria-hidden />
              <p className="text-sm font-medium">{(ORDER_STATUS_LABEL as Record<string, string>)[e.status] ?? e.status}</p>
              {e.note && <p className="text-sm text-charcoal/70">{e.note}</p>}
              <p className="text-xs text-charcoal/50">{dateFmt(e.created_at)}</p></li>
          ))}
        </ol>
      </section>
    </div>
  );
}
