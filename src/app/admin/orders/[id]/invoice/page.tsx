import { notFound } from "next/navigation";
import { requirePerm } from "@/server/auth";
import { getOrder, getOrderItems, parseAddress } from "@/server/orders";
import { getSettings } from "@/server/settings";
import { PrintButton } from "@/components/admin/ConfirmButton";
import { btnCls } from "@/components/admin/ui";
import { dateFmt, inr } from "@/lib/format";

export const dynamic = "force-dynamic";
const PRINT_CSS = `@media print{aside,.no-print{display:none!important}div.min-h-screen{display:block!important;background:#fff!important}div.min-h-screen>div{padding:0!important}@page{margin:14mm}}`;

export default async function Invoice({ params }: PageProps<"/admin/orders/[id]/invoice">) {
  await requirePerm("orders");
  const o = getOrder(Number((await params).id));
  if (!o) notFound();
  const s = getSettings(), items = getOrderItems(o.id), bill = parseAddress(o.billing_address), ship = parseAddress(o.shipping_address);
  const rate = Number(s.tax_rate) || 0, taxable = o.total + o.gift_card_used + o.points_used - o.tax;
  const half = Math.round(o.tax / 2);
  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-sm text-charcoal shadow-sm print:shadow-none">
      <style>{PRINT_CSS}</style>
      <div className="no-print mb-6 flex justify-end"><PrintButton className={btnCls} /></div>
      <header className="flex justify-between border-b border-charcoal/20 pb-6">
        <div><p className="font-serif text-3xl uppercase tracking-[0.1em]">{s.site_name}</p><p className="mt-1 text-xs text-charcoal/60">{s.support_email} · {s.support_phone}</p></div>
        <div className="text-right"><p className="font-serif text-2xl">Tax Invoice</p><p className="mt-1">No. <strong>{o.number}</strong></p><p>Date {dateFmt(o.created_at)}</p><p className="capitalize">Payment: {o.payment_status.replace("_", " ")}{o.payment_method ? ` (${o.payment_method})` : ""}</p></div>
      </header>
      <section className="grid grid-cols-2 gap-8 py-6">
        <div><p className="eyebrow">Billed to</p><p className="mt-2 leading-relaxed">{bill.name}<br />{bill.line1}{bill.line2 ? `, ${bill.line2}` : ""}<br />{bill.city}, {bill.state} {bill.pincode}<br />{bill.country}<br />{o.email}</p></div>
        <div><p className="eyebrow">Shipped to</p><p className="mt-2 leading-relaxed">{ship.name}<br />{ship.line1}{ship.line2 ? `, ${ship.line2}` : ""}<br />{ship.city}, {ship.state} {ship.pincode}<br />{ship.country}</p></div>
      </section>
      <table className="w-full text-left [&_td]:border-b [&_td]:border-charcoal/10 [&_td]:py-2 [&_th]:border-b [&_th]:border-charcoal/30 [&_th]:py-2 [&_th]:text-xs [&_th]:uppercase">
        <thead><tr><th>#</th><th>Description</th><th>SKU</th><th className="text-right">Rate</th><th className="text-right">Qty</th><th className="text-right">Amount</th></tr></thead>
        <tbody>{items.map((i, n) => <tr key={i.id}><td>{n + 1}</td><td>{i.name}{i.variant_label ? ` (${i.variant_label})` : ""}</td><td className="text-xs">{i.sku}</td><td className="text-right">{inr(i.price)}</td><td className="text-right">{i.qty}</td><td className="text-right">{inr(i.price * i.qty)}</td></tr>)}</tbody>
      </table>
      <dl className="ml-auto mt-6 max-w-xs space-y-1">
        <div className="flex justify-between"><dt>Subtotal</dt><dd>{inr(o.subtotal)}</dd></div>
        {o.discount > 0 && <div className="flex justify-between"><dt>Discount{o.coupon_code ? ` (${o.coupon_code})` : ""}</dt><dd>−{inr(o.discount)}</dd></div>}
        <div className="flex justify-between"><dt>Shipping</dt><dd>{o.shipping ? inr(o.shipping) : "Free"}</dd></div>
        {o.gift_wrap_fee > 0 && <div className="flex justify-between"><dt>Gift wrap</dt><dd>{inr(o.gift_wrap_fee)}</dd></div>}
        {o.gift_card_used > 0 && <div className="flex justify-between"><dt>Gift card</dt><dd>−{inr(o.gift_card_used)}</dd></div>}
        {o.points_used > 0 && <div className="flex justify-between"><dt>Loyalty points</dt><dd>−{inr(o.points_used)}</dd></div>}
        <div className="flex justify-between border-t border-charcoal/30 pt-2 text-base font-semibold"><dt>Total paid</dt><dd>{inr(o.total)}</dd></div>
      </dl>
      <section className="mt-8 border-t border-charcoal/15 pt-4 text-xs">
        <p className="eyebrow mb-2">GST breakup (prices include tax)</p>
        <table className="w-full max-w-sm text-left"><tbody>
          <tr><td>Taxable value</td><td className="text-right">{inr(Math.max(taxable, 0))}</td></tr>
          <tr><td>CGST @ {rate / 2}%</td><td className="text-right">{inr(half)}</td></tr>
          <tr><td>SGST @ {rate / 2}%</td><td className="text-right">{inr(o.tax - half)}</td></tr>
          <tr className="font-medium"><td>Total GST @ {rate}%</td><td className="text-right">{inr(o.tax)}</td></tr>
        </tbody></table>
        <p className="mt-2 text-charcoal/55">For inter-state supplies the same amount is levied as IGST. Add your GSTIN in settings/template before issuing legal invoices.</p>
      </section>
      <p className="mt-10 text-center text-xs text-charcoal/55">Thank you for supporting India&apos;s master artisans.</p>
    </div>
  );
}
