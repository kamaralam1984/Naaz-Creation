"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Notice, textareaCls } from "@/components/ui/Field";
import { useStore } from "@/components/providers/StoreProvider";
import { Price } from "@/components/ui/Price";
import { cn } from "@/lib/cn";

export function GiftCardPurchase({ productId, variants }: { productId: number; variants: { id: number; label: string; price: number }[] }) {
  const { addToCart } = useStore();
  const [vid, setVid] = useState<number | null>(variants[1]?.id ?? variants[0]?.id ?? null);
  const [email, setEmail] = useState(""); const [msg, setMsg] = useState(""); const [qty, setQty] = useState(1);
  const [err, setErr] = useState<string | null>(null);
  const v = variants.find((x) => x.id === vid);

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!v) return setErr("Choose an amount.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErr("Enter the recipient's email address.");
    setErr(null);
    addToCart({ productId, variantId: v.id, qty, meta: { recipientEmail: email.trim().toLowerCase(), message: msg.trim().slice(0, 300) || undefined } });
  }

  return (
    <div className="grid items-start gap-12 lg:grid-cols-2">
      <div className="gold-corners group relative aspect-[4/3] overflow-hidden rounded-lg bg-gradient-to-br from-[color:var(--wine-a)] to-[color:var(--wine-b)] shadow-[var(--shadow-lift)]">
        <div aria-hidden className="pattern-diamond absolute inset-0 opacity-80" />
        <div aria-hidden className="absolute -right-10 -top-16 h-64 w-64 rounded-full bg-champagne/25 blur-3xl" />
        <div aria-hidden className="animate-spin-slow absolute -bottom-24 -right-24 h-72 w-72 rounded-full border border-dashed border-champagne/50" />
        <span aria-hidden className="gold-line absolute inset-x-0 top-0 h-px" /><span aria-hidden className="gold-line absolute inset-x-0 bottom-0 h-px" />
        <div className="absolute inset-0 flex flex-col justify-between p-8 text-ivory">
          <div className="flex items-start justify-between"><p className="gold-text font-serif text-2xl uppercase tracking-[0.2em]">Nazi Creation</p><span aria-hidden className="h-8 w-11 rounded-[4px] bg-gradient-to-br from-[#f3e2b0] to-[#b8934f] opacity-90" /></div>
          <div><p className="eyebrow !text-champagne">Gift card</p><p className="mt-1 font-serif text-6xl">{v ? <Price inr={v.price} /> : "—"}</p></div>
        </div>
      </div>
      <form onSubmit={add} className="space-y-6" noValidate>
        <fieldset>
          <legend className="mb-2 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-charcoal/75">Amount</legend>
          <div className="flex flex-wrap gap-3">{variants.map((x) => <button type="button" key={x.id} aria-pressed={vid === x.id} onClick={() => setVid(x.id)} className={cn("h-12 min-w-24 border px-5 text-sm transition-colors", vid === x.id ? "border-charcoal bg-charcoal text-ivory" : "border-charcoal/30 hover:border-charcoal")}>{x.label}</button>)}</div>
        </fieldset>
        <Field label="Recipient email" name="gc-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} hint="The gift card code is emailed here once payment is confirmed." />
        <Field label="Personal message" name="gc-msg" hint={`${msg.length}/300`}><textarea id="gc-msg" maxLength={300} value={msg} onChange={(e) => setMsg(e.target.value)} className={textareaCls} /></Field>
        <div className="flex items-center gap-4">
          <div className="flex items-center border border-charcoal/25"><button type="button" aria-label="Decrease quantity" className="h-12 w-10" onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span className="w-8 text-center text-sm" aria-live="polite">{qty}</span><button type="button" aria-label="Increase quantity" className="h-12 w-10" onClick={() => setQty(Math.min(10, qty + 1))}>+</button></div>
          <Button type="submit" size="lg" className="flex-1">Add to bag</Button>
        </div>
        {err && <Notice tone="error">{err}</Notice>}
        <p className="text-xs text-charcoal/60">Delivered instantly by email · valid for 12 months · redeemable on anything in the house.</p>
      </form>
    </div>
  );
}
