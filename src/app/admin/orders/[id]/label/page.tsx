import { notFound } from "next/navigation";
import { requirePerm } from "@/server/auth";
import { getOrder, getOrderItems, parseAddress } from "@/server/orders";
import { orderWeightGrams } from "@/server/admin-queries";
import { getSettings } from "@/server/settings";
import { PrintButton } from "@/components/admin/ConfirmButton";
import { btnCls } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
const PRINT_CSS = `@media print{aside,.no-print{display:none!important}div.min-h-screen{display:block!important;background:#fff!important}div.min-h-screen>div{padding:0!important}@page{size:A5;margin:8mm}}`;

/** Decorative linear barcode derived from the order number (swap for a real courier AWB barcode when integrated). */
function Bars({ code }: { code: string }) {
  const widths: number[] = [2, 1, 2, 1, 3, 1];
  for (const ch of code) { const n = ch.charCodeAt(0); for (let b = 0; b < 4; b++) widths.push(((n >> b) & 1) + 1, 1 + ((n >> (b + 2)) & 1)); }
  widths.push(3, 1, 2, 1, 2);
  let x = 0; const rects: React.ReactNode[] = [];
  widths.forEach((w, i) => { if (i % 2 === 0) rects.push(<rect key={i} x={x} y={0} width={w} height={60} fill="#000" />); x += w; });
  return <svg viewBox={`0 0 ${x} 60`} role="img" aria-label={`Barcode ${code}`} className="h-16 w-full" preserveAspectRatio="none">{rects}</svg>;
}

export default async function Label({ params }: PageProps<"/admin/orders/[id]/label">) {
  await requirePerm("orders");
  const o = getOrder(Number((await params).id));
  if (!o) notFound();
  const a = parseAddress(o.shipping_address), items = getOrderItems(o.id).filter((i) => i.kind === "physical"), s = getSettings();
  const grams = orderWeightGrams(o.id);
  return (
    <div className="mx-auto max-w-md">
      <style>{PRINT_CSS}</style>
      <div className="no-print mb-4 flex justify-end"><PrintButton className={btnCls} /></div>
      <div className="border-2 border-black bg-white p-5 text-black">
        <div className="flex items-start justify-between border-b-2 border-black pb-3"><p className="font-serif text-xl uppercase tracking-[0.12em]">{s.site_name}</p><p className="text-right text-xs uppercase">{o.delivery_method === "express" ? "EXPRESS" : "STANDARD"}<br />{o.carrier ?? "Carrier: —"}</p></div>
        <div className="py-4"><p className="text-xs uppercase">Ship to</p><p className="mt-1 text-lg font-semibold leading-snug">{a.name}</p>
          <p className="text-base leading-snug">{a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />{a.city}, {a.state}<br /><span className="text-2xl font-bold tracking-widest">{a.pincode}</span> {a.country}</p><p className="mt-1 text-sm">Phone: {a.phone}</p></div>
        <div className="border-t-2 border-black pt-3"><Bars code={o.tracking_number || o.number} /><p className="mt-1 text-center font-mono text-sm tracking-[0.3em]">{o.tracking_number || o.number}</p></div>
        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-black pt-3 text-xs"><div><p className="uppercase">Order</p><p className="text-sm font-semibold">{o.number}</p></div><div><p className="uppercase">Est. weight</p><p className="text-sm font-semibold">{(grams / 1000).toFixed(2)} kg</p></div></div>
        <div className="mt-3 border-t border-black pt-3 text-xs"><p className="uppercase">Contents ({items.reduce((n, i) => n + i.qty, 0)} pcs)</p><ul className="mt-1 space-y-0.5">{items.map((i) => <li key={i.id}>{i.qty} × {i.name}{i.variant_label ? ` (${i.variant_label})` : ""}</li>)}</ul></div>
        <p className="mt-3 border-t border-black pt-2 text-center text-[0.65rem] uppercase">Handle with care — handcrafted · Return to {s.site_name}, {s.support_email}</p>
      </div>
    </div>
  );
}
