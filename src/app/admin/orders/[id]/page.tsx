import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePerm } from "@/server/auth";
import { getOrder, getOrderEvents, getOrderItems, parseAddress } from "@/server/orders";
import { orderPayments } from "@/server/admin-queries";
import { first } from "@/server/admin-queries";
import { ORDER_STATUSES, ORDER_STATUS_LABEL } from "@/server/types";
import { PageHeader, Panel, StatusBadge, btnCls, btnDanger, btnOutline, fieldCls, labelCls, tableCls } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { cancelOrderAction, refundAction, updateStatusAction } from "../actions";
import { dateFmt, inr } from "@/lib/format";

export const dynamic = "force-dynamic";
const Addr = ({ a }: { a: ReturnType<typeof parseAddress> }) => <address className="text-sm not-italic leading-relaxed">{a.name}<br />{a.line1}{a.line2 ? <>, {a.line2}</> : null}<br />{a.city}, {a.state} {a.pincode}<br />{a.country}<br />☎ {a.phone}</address>;

export default async function AdminOrder({ params, searchParams }: PageProps<"/admin/orders/[id]">) {
  await requirePerm("orders");
  const [{ id: raw }, sp] = [await params, await searchParams];
  const o = getOrder(Number(raw));
  if (!o) notFound();
  const items = getOrderItems(o.id), events = getOrderEvents(o.id), payments = orderPayments(o.id);
  const refunded = payments.filter((p) => p.status === "refunded").reduce((s, p) => s + p.amount, 0);
  const refundable = ["paid", "partially_refunded"].includes(o.payment_status) ? o.total - refunded : 0;
  const closed = ["cancelled", "refunded", "returned"].includes(o.status);
  return (
    <>
      <PageHeader title={`Order ${o.number}`} sub={`Placed ${dateFmt(o.created_at)}`}
        actions={<><Link href={`/admin/orders/${o.id}/invoice`} className={btnOutline} target="_blank">Invoice</Link><Link href={`/admin/orders/${o.id}/label`} className={btnOutline} target="_blank">Shipping label</Link><Link href="/admin/orders" className="link-underline self-center text-xs uppercase tracking-[0.16em]">← Orders</Link></>} />
      {first(sp.notice) && <p role="status" className="mb-4 border border-green-800/30 bg-green-50 px-4 py-3 text-sm text-green-900">{first(sp.notice)}</p>}
      {first(sp.err) && <p role="alert" className="mb-4 border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">{first(sp.err)}</p>}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Panel title="Items" className="!p-0">
            <div className="overflow-x-auto"><table className={tableCls}><thead><tr><th>Item</th><th>SKU</th><th className="text-right">Price</th><th className="text-right">Qty</th><th className="text-right">Total</th></tr></thead>
              <tbody>{items.map((i) => <tr key={i.id}><td>{i.product_id ? <Link className="link-underline" href={`/admin/products/${i.product_id}`}>{i.name}</Link> : i.name}{i.variant_label && <span className="text-charcoal/55"> · {i.variant_label}</span>}</td><td className="text-xs">{i.sku}</td><td className="text-right">{inr(i.price)}</td><td className="text-right">{i.qty}</td><td className="text-right">{inr(i.price * i.qty)}</td></tr>)}</tbody></table></div>
            <dl className="ml-auto max-w-xs space-y-1 p-5 text-sm">
              {([["Subtotal", o.subtotal], ["Discount" + (o.coupon_code ? ` (${o.coupon_code})` : ""), -o.discount], ["Shipping", o.shipping], ["Gift wrap", o.gift_wrap_fee], ["Gift card", -o.gift_card_used], ["Loyalty points", -o.points_used]] as [string, number][]).filter(([, v]) => v).map(([k, v]) => <div key={k} className="flex justify-between"><dt className="text-charcoal/65">{k}</dt><dd>{v < 0 ? "−" : ""}{inr(Math.abs(v))}</dd></div>)}
              <div className="flex justify-between border-t border-charcoal/15 pt-2 font-medium"><dt>Total</dt><dd>{inr(o.total)}</dd></div>
              <div className="flex justify-between text-xs text-charcoal/55"><dt>Includes GST</dt><dd>{inr(o.tax)}</dd></div>
              {refunded > 0 && <div className="flex justify-between text-burgundy"><dt>Refunded</dt><dd>−{inr(refunded)}</dd></div>}
            </dl>
          </Panel>

          <div className="grid gap-6 md:grid-cols-2">
            <Panel title="Ship to"><Addr a={parseAddress(o.shipping_address)} /><p className="mt-3 text-xs text-charcoal/60">Delivery: {o.delivery_method}</p></Panel>
            <Panel title="Bill to"><Addr a={parseAddress(o.billing_address)} /></Panel>
          </div>
          {(o.gift_wrap || o.gift_message || o.notes) && <Panel title="Gift & notes"><div className="space-y-2 text-sm">{o.gift_wrap ? <p>🎁 Gift wrap requested</p> : null}{o.gift_message && <p>Message: “{o.gift_message}”</p>}{o.notes && <p>Customer note: {o.notes}</p>}</div></Panel>}

          <Panel title="Payments" className="!p-0">
            <div className="overflow-x-auto"><table className={tableCls}><thead><tr><th>When</th><th>Provider</th><th>Reference</th><th>Method</th><th>Status</th><th className="text-right">Amount</th></tr></thead>
              <tbody>{payments.map((p) => <tr key={p.id}><td>{dateFmt(p.created_at)}</td><td className="capitalize">{p.provider}</td><td className="text-xs">{p.provider_payment_id ?? "—"}</td><td>{p.method ?? "—"}</td><td><StatusBadge status={p.status === "captured" ? "paid" : p.status} /></td><td className="text-right">{inr(p.amount)}</td></tr>)}
                {!payments.length && <tr><td colSpan={6} className="text-charcoal/55">No payment recorded yet.</td></tr>}</tbody></table></div>
            {o.razorpay_order_id && <p className="px-5 pb-4 text-xs text-charcoal/55">Gateway order: {o.razorpay_order_id}</p>}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Status"><div className="flex gap-2"><StatusBadge status={o.status} /><StatusBadge status={o.payment_status} /></div>
            {o.tracking_number && <p className="mt-3 text-sm">Tracking: <strong>{o.tracking_number}</strong>{o.carrier && ` (${o.carrier})`}</p>}
            {closed ? <p className="mt-4 text-sm text-charcoal/60">This order is {o.status} and can no longer be changed.</p> : (
              <form action={updateStatusAction} className="mt-5 space-y-3">
                <input type="hidden" name="id" value={o.id} />
                <div><label className={labelCls} htmlFor="status">Move to</label>
                  <select id="status" name="status" className={fieldCls} defaultValue="">{<option value="" disabled>Select status…</option>}{ORDER_STATUSES.filter((s) => s !== o.status && s !== "pending" && s !== "refunded").map((s) => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-3"><div><label className={labelCls} htmlFor="carrier">Carrier</label><input id="carrier" name="carrier" defaultValue={o.carrier ?? ""} className={fieldCls} /></div><div><label className={labelCls} htmlFor="tracking">Tracking no.</label><input id="tracking" name="tracking" defaultValue={o.tracking_number ?? ""} className={fieldCls} /></div></div>
                <div><label className={labelCls} htmlFor="note">Note (shown in timeline)</label><input id="note" name="note" maxLength={300} className={fieldCls} /></div>
                <button className={btnCls}>Update status</button>
                {!["shipped", "out_for_delivery", "delivered"].includes(o.status) && (
                  <ConfirmButton formAction={cancelOrderAction} className={btnDanger + " ml-3"} message="Cancel this order and release its stock?">Cancel order</ConfirmButton>
                )}
              </form>
            )}
          </Panel>

          <Panel title="Refund">
            {refundable > 0 ? (
              <form action={refundAction} className="space-y-3">
                <input type="hidden" name="id" value={o.id} />
                <div><label className={labelCls} htmlFor="amount">Amount (max {inr(refundable)})</label><input id="amount" name="amount" type="number" min={1} max={refundable} defaultValue={refundable} required className={fieldCls} /></div>
                <div><label className={labelCls} htmlFor="rnote">Reason</label><input id="rnote" name="note" maxLength={300} className={fieldCls} /></div>
                <ConfirmButton className={btnDanger} message="Issue this refund? With live Razorpay keys the money is returned to the customer.">Issue refund</ConfirmButton>
              </form>
            ) : <p className="text-sm text-charcoal/60">{o.payment_status === "paid" || o.payment_status === "partially_refunded" ? "Fully refunded." : "Nothing to refund — no captured payment."}</p>}
          </Panel>

          <Panel title="Customer">
            <p className="text-sm">{o.email}<br />{o.phone}</p>
            {o.user_id ? <Link href={`/admin/customers/${o.user_id}`} className="link-underline mt-3 inline-block text-xs uppercase tracking-[0.16em]">View customer →</Link> : <p className="mt-2 text-xs text-charcoal/55">Guest checkout</p>}
          </Panel>

          <Panel title="Timeline">
            <ol className="space-y-4 border-l border-charcoal/15 pl-4">{[...events].reverse().map((e) => <li key={e.id} className="relative text-sm"><span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-champagne-deep" aria-hidden /><StatusBadge status={e.status} /> <span className="text-xs text-charcoal/55">{dateFmt(e.created_at)}</span>{e.note && <p className="mt-1 text-charcoal/75">{e.note}</p>}</li>)}</ol>
          </Panel>
        </div>
      </div>
    </>
  );
}
