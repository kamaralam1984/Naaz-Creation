"use client";
import { ProductArt } from "@/components/product/ProductArt";
import { Price } from "@/components/ui/Price";
import type { Quote } from "@/server/pricing";

export function OrderSummary({ q, compact }: { q: Quote; compact?: boolean }) {
  const row = (label: string, inr: number, neg = false, free = false) => (
    <div className="flex justify-between py-1.5 text-sm"><dt className="text-charcoal/75">{label}</dt><dd>{neg ? "−" : ""}{free && inr === 0 ? <span className="text-green-800">Free</span> : <Price inr={inr} />}</dd></div>
  );
  return (
    <div>
      {!compact && (
        <ul className="divide-y divide-charcoal/10">
          {q.lines.map((l) => (
            <li key={`${l.productId}-${l.variantId}-${l.meta?.recipientEmail ?? ""}`} className="flex gap-4 py-4">
              <span className="relative h-20 w-16 shrink-0 overflow-hidden">{l.image ? <img src={l.image} alt="" className="h-full w-full object-contain" /> : <ProductArt tone={l.tone} kind={l.kind === "giftcard" ? "default" : l.categorySlug ?? "default"} />}<span className="absolute -right-0 -top-0 bg-charcoal px-1.5 text-[0.65rem] text-ivory">{l.qty}</span></span>
              <div className="flex-1 text-sm"><p className="font-serif text-lg leading-tight">{l.name}</p>{l.variantLabel && <p className="text-xs text-charcoal/60">{l.variantLabel}</p>}{l.error && <p className="text-xs text-burgundy">{l.error}</p>}</div>
              <p className="text-sm"><Price inr={l.lineTotal} /></p>
            </li>
          ))}
        </ul>
      )}
      <dl className="mt-3 border-t border-charcoal/10 pt-3">
        {row("Subtotal", q.subtotal)}
        {q.discount > 0 && row(`Discount${q.couponCode ? ` (${q.couponCode})` : ""}`, q.discount, true)}
        {q.hasPhysical && row("Shipping", q.shipping, false, true)}
        {q.giftWrapFee > 0 && row("Gift wrapping", q.giftWrapFee)}
        {q.giftCardUsed > 0 && row("Gift card", q.giftCardUsed, true)}
        {q.pointsUsed > 0 && row("Loyalty points", q.pointsUsed, true)}
        <div className="mt-2 flex justify-between border-t border-charcoal/10 pt-3 font-serif text-2xl"><dt>Total</dt><dd><Price inr={q.total} /></dd></div>
        <p className="mt-1 text-right text-xs text-charcoal/55">Includes <Price inr={q.tax} /> GST</p>
      </dl>
    </div>
  );
}
