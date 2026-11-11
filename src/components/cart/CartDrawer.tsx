"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import { ProductArt } from "@/components/product/ProductArt";
import { Button } from "@/components/ui/Button";
import { Price } from "@/components/ui/Price";
import { cartKey } from "@/lib/format";
import { ease } from "@/lib/motion";
import type { Quote } from "@/server/pricing";

export function useQuote(extra: Record<string, unknown> = {}, enabled = true) {
  const { cart } = useStore();
  const [q, setQ] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const sig = JSON.stringify([cart, extra]);
  useEffect(() => {
    if (!enabled) return;
    if (!cart.length) { setQ(null); return; }
    const ctl = new AbortController(); setLoading(true);
    const t = setTimeout(() => {
      fetch("/api/cart/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lines: cart, ...extra }), signal: ctl.signal })
        .then((r) => r.json()).then((d) => { if (d.lines) setQ(d); }).catch(() => {}).finally(() => setLoading(false));
    }, 150);
    return () => { clearTimeout(t); ctl.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, enabled]);
  return { quote: q, loading };
}

export function CartDrawer() {
  const { drawerOpen, closeDrawer, cart, setQty, removeLine } = useStore();
  const { quote } = useQuote({}, drawerOpen);
  useEffect(() => { document.body.style.overflow = drawerOpen ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [drawerOpen]);
  useEffect(() => { const f = (e: KeyboardEvent) => e.key === "Escape" && closeDrawer(); window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f); }, [closeDrawer]);

  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          <motion.div className="fixed inset-0 z-[70] bg-charcoal/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeDrawer} />
          <motion.aside role="dialog" aria-modal="true" aria-label="Shopping bag" className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-md flex-col bg-ivory"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.5, ease }}>
            <div className="flex items-center justify-between border-b border-charcoal/10 p-5">
              <h2 className="font-serif text-2xl">Your bag</h2>
              <button onClick={closeDrawer} aria-label="Close bag" className="p-2"><X size={20} /></button>
            </div>
            {!cart.length ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
                <ShoppingBag size={36} strokeWidth={1.2} className="text-champagne-deep" />
                <p className="font-serif text-2xl">Your bag is empty</p>
                <Button href="/shop" onClick={closeDrawer}>Continue shopping</Button>
              </div>
            ) : (
              <>
                {quote && quote.hasPhysical && (
                  <div className="border-b border-charcoal/10 px-5 py-3 text-xs">
                    {quote.freeShippingRemaining > 0 ? <p>Add <strong><Price inr={quote.freeShippingRemaining} /></strong> more for free shipping</p> : <p className="text-champagne-deep">You&apos;ve unlocked free shipping</p>}
                    <div className="mt-2 h-1 bg-beige"><div className="h-full bg-champagne-deep transition-all" style={{ width: `${Math.min(100, (quote.subtotal / (quote.subtotal + quote.freeShippingRemaining || 1)) * 100)}%` }} /></div>
                  </div>
                )}
                <ul className="flex-1 divide-y divide-charcoal/10 overflow-y-auto px-5">
                  {(quote?.lines ?? []).map((l) => {
                    const key = cartKey(l);
                    return (
                      <li key={key} className="flex gap-4 py-5">
                        <Link href={`/product/${l.slug}`} onClick={closeDrawer} className="relative h-24 w-20 shrink-0 overflow-hidden">
                          {l.image ? <img src={l.image} alt={l.name} className="h-full w-full object-contain" /> : <ProductArt tone={l.tone} kind={l.kind === "giftcard" ? "default" : (l.categorySlug ?? "default")} label={l.name} />}
                        </Link>
                        <div className="flex flex-1 flex-col">
                          <Link href={`/product/${l.slug}`} onClick={closeDrawer} className="font-serif text-lg leading-tight">{l.name}</Link>
                          {l.variantLabel && <p className="text-xs text-charcoal/60">{l.variantLabel}</p>}
                          {l.error && <p className="mt-1 text-xs text-burgundy">{l.error}</p>}
                          <div className="mt-auto flex items-center justify-between pt-3">
                            <div className="flex items-center border border-charcoal/25">
                              <button aria-label="Decrease quantity" className="p-2" onClick={() => setQty(key, l.qty - 1)}><Minus size={12} /></button>
                              <span className="w-7 text-center text-sm" aria-live="polite">{l.qty}</span>
                              <button aria-label="Increase quantity" className="p-2" onClick={() => setQty(key, l.qty + 1)}><Plus size={12} /></button>
                            </div>
                            <p className="text-sm font-medium"><Price inr={l.lineTotal} /></p>
                          </div>
                          <button onClick={() => removeLine(key)} className="mt-2 self-start text-xs text-charcoal/60 underline">Remove</button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <div className="border-t border-charcoal/10 p-5">
                  <p className="flex justify-between text-sm"><span>Subtotal</span><strong><Price inr={quote?.subtotal ?? 0} /></strong></p>
                  <p className="mt-1 text-xs text-charcoal/60">Shipping and taxes calculated at checkout.</p>
                  <div className="mt-4 grid gap-3">
                    <Button href="/checkout" size="lg" onClick={closeDrawer}>Checkout</Button>
                    <Button href="/cart" variant="outline" onClick={closeDrawer}>View bag</Button>
                  </div>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
