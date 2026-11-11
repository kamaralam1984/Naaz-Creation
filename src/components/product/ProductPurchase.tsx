"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Heart, Minus, Plus, Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Price } from "@/components/ui/Price";
import { useStore } from "@/components/providers/StoreProvider";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/cn";
import type { Product, Variant } from "@/server/types";

type Est = { serviceable: boolean; message: string; min?: number; max?: number };

export function ProductPurchase({ p, variants }: { p: Product; variants: Variant[] }) {
  const router = useRouter();
  const { addToCart, inWishlist, toggleWishlist, pushRecent } = useStore();
  const [vid, setVid] = useState<number | null>(variants.length === 1 ? variants[0].id : null);
  const [qty, setQty] = useState(1);
  const [pin, setPin] = useState(""); const [est, setEst] = useState<Est | null>(null); const [checking, setChecking] = useState(false);
  const [rcpt, setRcpt] = useState(""); const [msg, setMsg] = useState("");
  const [added, setAdded] = useState(false);
  const gift = p.kind === "giftcard";
  const ctaRef = useRef<HTMLDivElement>(null);
  const optRef = useRef<HTMLFieldSetElement>(null);
  const [ctaSeen, setCtaSeen] = useState(true);
  const [footerSeen, setFooterSeen] = useState(false);

  // Sticky bar shows whenever the main buttons are off-screen (and hides again over the footer).
  useEffect(() => {
    const cta = ctaRef.current; if (!cta) return;
    const o1 = new IntersectionObserver(([e]) => setCtaSeen(e.isIntersecting), { threshold: 0.1 });
    o1.observe(cta);
    const f = document.querySelector("footer"); let o2: IntersectionObserver | undefined;
    if (f) { o2 = new IntersectionObserver(([e]) => setFooterSeen(e.isIntersecting), { threshold: 0.05 }); o2.observe(f); }
    return () => { o1.disconnect(); o2?.disconnect(); };
  }, []);

  useEffect(() => { pushRecent(p.id); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [p.id]);

  const v = variants.find((x) => x.id === vid);
  const price = v?.price ?? p.price;
  const stock = v ? v.stock : p.stock;
  const needVariant = variants.length > 0 && !v;
  const out = !gift && (variants.length ? (v ? v.stock <= 0 : variants.every((x) => x.stock <= 0)) : p.stock <= 0);
  const giftOk = !gift || /.+@.+\..+/.test(rcpt);
  const discount = p.compare_at && p.compare_at > price ? Math.round((1 - price / p.compare_at) * 100) : 0;
  const saved = inWishlist(p.id);
  const low = !gift && stock > 0 && stock <= p.low_stock_threshold;

  const line = () => ({ productId: p.id, variantId: v?.id ?? null, qty, meta: gift ? { recipientEmail: rcpt, message: msg || undefined } : undefined });
  const add = () => { addToCart(line()); setAdded(true); setTimeout(() => setAdded(false), 1800); };
  const buyNow = () => { addToCart(line(), { silent: true }); router.push("/checkout"); };

  const show = !ctaSeen && !footerSeen;
  useEffect(() => {
    document.body.classList.toggle("has-sticky-cta", show);
    return () => document.body.classList.remove("has-sticky-cta");
  }, [show]);
  const scrollTo = (el: Element | null) => { el?.scrollIntoView({ behavior: "smooth", block: "center" }); (el?.querySelector("button,input") as HTMLElement | null)?.focus({ preventScroll: true }); };
  const stickyLabel = added ? "Added ✓" : out ? "Sold out" : needVariant ? "Select an option" : !giftOk ? "Add recipient" : "Add to bag";
  const stickyAction = () => {
    if (needVariant) return scrollTo(optRef.current);
    if (!giftOk) return scrollTo(document.getElementById("g-email")?.parentElement ?? null);
    add();
  };

  async function check(e: React.FormEvent) {
    e.preventDefault(); setChecking(true);
    try { setEst(await fetch(`/api/pincode?pin=${encodeURIComponent(pin)}`).then((r) => r.json())); } catch { setEst({ serviceable: false, message: "Couldn't check right now." }); }
    setChecking(false);
  }

  return (
    <div>
      <div className="flex items-baseline gap-3">
        <p className="font-serif text-4xl"><Price inr={price} /></p>
        {p.compare_at && discount > 0 && <><s className="text-lg text-charcoal/50"><Price inr={p.compare_at} /></s><span className="bg-burgundy px-2 py-0.5 text-xs text-ivory">{discount}% off</span></>}
      </div>
      <p className="mt-1 text-xs text-charcoal/60">{discount > 0 && <>You save <Price inr={(p.compare_at ?? price) - price} /> · </>}Inclusive of all taxes</p>

      <p className={cn("mt-4 flex items-center gap-2 text-sm", out ? "text-burgundy" : low ? "text-amber-800" : "text-green-800")}>
        <span className={cn("h-2 w-2 rounded-full", out ? "bg-burgundy" : low ? "bg-amber-600" : "bg-green-700")} aria-hidden />
        {gift ? "Delivered instantly by email" : out ? "Currently sold out" : low ? `Only ${stock} left — handmade in small batches` : "In stock"}
      </p>

      {variants.length > 0 && (
        <fieldset ref={optRef} className="mt-6">
          <legend className="eyebrow mb-3">{gift ? "Amount" : "Option"}{v && <span className="ml-2 normal-case tracking-normal text-charcoal">{v.label}</span>}</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((x) => (
              <button key={x.id} type="button" onClick={() => setVid(x.id)} disabled={!gift && x.stock <= 0} aria-pressed={vid === x.id}
                className={cn("min-w-14 border px-4 py-2.5 text-sm transition-colors disabled:cursor-not-allowed disabled:line-through disabled:opacity-40", vid === x.id ? "border-charcoal bg-charcoal text-ivory" : "border-charcoal/30 hover:border-charcoal")}>{x.label}</button>
            ))}
          </div>
        </fieldset>
      )}

      {gift && (
        <div className="mt-6 grid gap-4">
          <div><label htmlFor="g-email" className="eyebrow mb-1.5 block">Recipient email *</label><input id="g-email" type="email" value={rcpt} onChange={(e) => setRcpt(e.target.value)} className="h-12 w-full border border-charcoal/25 bg-transparent px-4 text-sm focus:border-charcoal focus:outline-none" /></div>
          <div><label htmlFor="g-msg" className="eyebrow mb-1.5 block">Personal message</label><textarea id="g-msg" value={msg} maxLength={300} onChange={(e) => setMsg(e.target.value)} className="min-h-24 w-full border border-charcoal/25 bg-transparent p-4 text-sm focus:border-charcoal focus:outline-none" /></div>
        </div>
      )}

      <div className="mt-6 flex items-center gap-4">
        <div className="flex items-center border border-charcoal/30" role="group" aria-label="Quantity">
          <button type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-3.5"><Minus size={14} /></button>
          <span className="w-9 text-center text-sm" aria-live="polite">{qty}</span>
          <button type="button" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(gift ? 10 : Math.max(stock, 1), q + 1))} className="p-3.5"><Plus size={14} /></button>
        </div>
        <button type="button" onClick={() => toggleWishlist(p.id)} aria-pressed={saved} aria-label={saved ? "Remove from wishlist" : "Add to wishlist"} className="flex h-12 w-12 items-center justify-center border border-charcoal/30 hover:border-charcoal"><Heart size={19} className={cn(saved && "fill-burgundy text-burgundy")} /></button>
      </div>

      <div ref={ctaRef} className="mt-5 grid gap-3 sm:grid-cols-2">
        <Button size="lg" disabled={out || needVariant || !giftOk} onClick={add}>{added ? <><Check size={16} /> Added</> : out ? "Sold out" : needVariant ? "Select an option" : "Add to bag"}</Button>
        <Button size="lg" variant="outline" disabled={out || needVariant || !giftOk} onClick={buyNow}>Buy now</Button>
      </div>

      {!gift && (
        <div className="mt-8 border-t border-charcoal/10 pt-6">
          <p className="eyebrow flex items-center gap-2"><Truck size={14} /> Delivery</p>
          <form onSubmit={check} className="mt-3 flex max-w-sm gap-2">
            <label htmlFor="pin" className="sr-only">PIN code</label>
            <input id="pin" inputMode="numeric" maxLength={6} placeholder="Enter 6-digit PIN" value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setEst(null); }} className="h-11 flex-1 border border-charcoal/25 bg-transparent px-4 text-sm focus:border-charcoal focus:outline-none" />
            <button disabled={pin.length !== 6 || checking} className="h-11 bg-charcoal px-5 text-xs uppercase tracking-[0.16em] text-ivory disabled:opacity-50">{checking ? "…" : "Check"}</button>
          </form>
          {est && <p role="status" className={cn("mt-3 text-sm", est.serviceable ? "text-green-800" : "text-burgundy")}>{est.message}</p>}
          <p className="mt-3 text-xs text-charcoal/60">Free shipping above ₹3,000 · Express available at checkout · International shipping on request</p>
        </div>
      )}
      <AnimatePresence>
        {show && (
          <motion.div key="sticky" initial={{ y: 90, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 90, opacity: 0 }} transition={{ duration: 0.4, ease }}
            role="region" aria-label="Quick add to bag"
            className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-[57] border-t border-champagne/50 bg-ivory/95 shadow-[0_-12px_30px_-14px_rgb(38_35_31/0.4)] backdrop-blur-xl lg:bottom-0">
            <span aria-hidden className="gold-line absolute inset-x-0 top-0 h-px" />
            <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-2.5 sm:px-8 lg:px-10">
              {p.images[0] && <span className="relative hidden h-12 w-12 shrink-0 overflow-hidden rounded bg-beige sm:block"><Image src={p.images[0]} alt="" fill sizes="48px" className="object-contain p-1" /></span>}
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-base leading-tight sm:text-lg">{p.name}</p>
                <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
                  <span className="font-semibold"><Price inr={price} /></span>
                  {p.compare_at && discount > 0 && <><s className="text-xs text-charcoal/50"><Price inr={p.compare_at} /></s><span className="text-xs font-medium text-danger">{discount}% off</span></>}
                  {v && <span className="text-xs text-charcoal/60">· {v.label}</span>}
                </p>
              </div>
              <Button size="md" className="shrink-0 !px-5 sm:!px-8" disabled={out} onClick={stickyAction}>{stickyLabel}</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
