"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import { useQuote } from "@/components/cart/CartDrawer";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { ProductArt } from "@/components/product/ProductArt";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Field";
import { Price } from "@/components/ui/Price";
import { cartKey } from "@/lib/format";

export function CartView() {
  const { cart, ready, setQty, removeLine } = useStore();
  const [input, setInput] = useState(""); const [code, setCode] = useState("");
  useEffect(() => { try { const c = localStorage.getItem("kh_coupon") ?? ""; setCode(c); setInput(c); } catch {} }, []);
  const { quote, loading } = useQuote({ couponCode: code || null });
  const apply = () => { const c = input.trim().toUpperCase(); setCode(c); try { localStorage.setItem("kh_coupon", c); } catch {} };
  const clear = () => { setCode(""); setInput(""); try { localStorage.removeItem("kh_coupon"); } catch {} };

  if (!ready) return <p className="mt-10 text-sm text-charcoal/60">Loading your bag…</p>;
  if (!cart.length) return (
    <div className="mt-12 flex flex-col items-center gap-5 border border-charcoal/10 bg-beige/40 p-16 text-center">
      <ShoppingBag size={40} strokeWidth={1.2} className="text-champagne-deep" /><p className="font-serif text-3xl">Your bag is empty</p>
      <p className="max-w-sm text-sm text-charcoal/70">Every piece is made to order by hand — start with something that speaks to you.</p>
      <Button href="/shop" size="lg">Explore the collection</Button>
    </div>
  );

  return (
    <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_380px]">
      <div>
        {quote && quote.hasPhysical && (
          <p className="mb-4 border border-champagne-deep/30 bg-beige/50 px-4 py-3 text-sm">{quote.freeShippingRemaining > 0 ? <>Add <strong><Price inr={quote.freeShippingRemaining} /></strong> more to unlock free shipping.</> : "You've unlocked free shipping 🎉"}</p>
        )}
        <ul className="divide-y divide-charcoal/10 border-y border-charcoal/10">
          {(quote?.lines ?? []).map((l) => {
            const key = cartKey(l);
            return (
              <li key={key} className="flex gap-5 py-6">
                <Link href={`/product/${l.slug}`} className="relative h-32 w-26 shrink-0 overflow-hidden sm:w-28">{l.image ? <img src={l.image} alt={l.name} className="h-full w-full object-contain" /> : <ProductArt tone={l.tone} kind={l.kind === "giftcard" ? "default" : l.categorySlug ?? "default"} label={l.name} />}</Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex justify-between gap-4"><Link href={`/product/${l.slug}`} className="font-serif text-2xl leading-tight">{l.name}</Link><p className="whitespace-nowrap"><Price inr={l.lineTotal} /></p></div>
                  {l.variantLabel && <p className="mt-1 text-sm text-charcoal/60">{l.variantLabel}</p>}
                  {l.meta?.recipientEmail && <p className="mt-1 text-xs text-charcoal/60">For {l.meta.recipientEmail}</p>}
                  <p className="mt-1 text-xs text-charcoal/50"><Price inr={l.price} /> each</p>
                  {l.error && <p className="mt-2 text-sm text-danger" role="alert">{l.error}</p>}
                  <div className="mt-auto flex items-center gap-5 pt-4">
                    <div className="flex items-center border border-charcoal/30" role="group" aria-label={`Quantity for ${l.name}`}>
                      <button aria-label="Decrease quantity" className="p-3" onClick={() => setQty(key, l.qty - 1)}><Minus size={13} /></button>
                      <span className="w-8 text-center text-sm">{l.qty}</span>
                      <button aria-label="Increase quantity" className="p-3" onClick={() => setQty(key, l.qty + 1)}><Plus size={13} /></button>
                    </div>
                    <button onClick={() => removeLine(key)} className="text-xs uppercase tracking-[0.16em] underline">Remove</button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <Link href="/shop" className="link-underline mt-6 inline-block text-xs uppercase tracking-[0.2em]">← Continue shopping</Link>
      </div>

      <aside className="h-fit border border-charcoal/10 bg-beige/40 p-6 lg:sticky lg:top-28" aria-label="Order summary">
        <h2 className="font-serif text-2xl">Summary</h2>
        <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); apply(); }}>
          <label htmlFor="coupon" className="sr-only">Coupon code</label>
          <input id="coupon" value={input} onChange={(e) => setInput(e.target.value.toUpperCase())} placeholder="Coupon code" className="h-11 flex-1 border border-charcoal/25 bg-transparent px-3 text-sm uppercase" />
          <button className="h-11 bg-charcoal px-4 text-xs uppercase tracking-[0.16em] text-ivory">Apply</button>
        </form>
        {quote?.couponCode && <p className="mt-2 flex items-center justify-between text-sm text-green-800">Applied: {quote.couponCode} <button onClick={clear} className="text-xs text-charcoal underline">Remove</button></p>}
        {quote?.couponError && code && <div className="mt-2"><Notice tone="error">{quote.couponError}</Notice></div>}
        <div className={loading ? "opacity-60" : ""}>{quote && <OrderSummary q={quote} compact />}</div>
        <p className="mt-2 text-xs text-charcoal/55">Shipping is calculated at checkout.</p>
        <Button href="/checkout" size="lg" className="mt-5 w-full" aria-disabled={!quote?.ok}>Checkout</Button>
        {quote && !quote.ok && <p className="mt-3 text-xs text-danger" role="alert">Please fix the highlighted items before checking out.</p>}
      </aside>
    </div>
  );
}
