"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Notice, textareaCls } from "@/components/ui/Field";
import { useStore } from "@/components/providers/StoreProvider";
import { Price } from "@/components/ui/Price";
import { GiftCardArt } from "@/components/content/GiftCardArt";
import { cn } from "@/lib/cn";

export function GiftCardPurchase({ productId, variants }: { productId: number; variants: { id: number; label: string; price: number }[] }) {
  const { addToCart } = useStore();
  const [vid, setVid] = useState<number | null>(variants[1]?.id ?? variants[0]?.id ?? null);
  const [email, setEmail] = useState(""); const [msg, setMsg] = useState(""); const [qty, setQty] = useState(1);
  const [err, setErr] = useState<string | null>(null);
  const [errField, setErrField] = useState<"amount" | "email" | null>(null);
  const v = variants.find((x) => x.id === vid);

  function add(e: React.FormEvent) {
    e.preventDefault();
    const fail = (field: "amount" | "email", message: string) => {
      setErr(message); setErrField(field);
      const el = document.getElementById(field === "email" ? "gc-email" : "gc-amount");
      el?.scrollIntoView({ behavior: "smooth", block: "center" }); if (field === "email") (el as HTMLInputElement | null)?.focus({ preventScroll: true });
    };
    if (!v) return fail("amount", "Choose an amount.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return fail("email", "Enter the recipient's email address.");
    setErr(null); setErrField(null);
    addToCart({ productId, variantId: v.id, qty, meta: { recipientEmail: email.trim().toLowerCase(), message: msg.trim().slice(0, 300) || undefined } });
  }

  return (
    <div className="grid items-start gap-12 lg:grid-cols-2">
      <GiftCardArt amount={v ? <Price inr={v.price} /> : "—"} className="aspect-[4/3] sm:aspect-[16/10]" />
      <form onSubmit={add} className="space-y-6" noValidate>
        <fieldset id="gc-amount">
          <legend className="mb-2 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-charcoal/75">Amount</legend>
          <div className="flex flex-wrap gap-3">{variants.map((x) => <button type="button" key={x.id} aria-pressed={vid === x.id} onClick={() => setVid(x.id)} className={cn("h-12 min-w-24 border px-5 text-sm transition-colors", vid === x.id ? "border-charcoal bg-charcoal text-ivory" : "border-charcoal/30 hover:border-charcoal")}>{x.label}</button>)}</div>
        </fieldset>
        <Field label="Recipient email" name="gc-email" type="email" required value={email} onChange={(e) => { setEmail(e.target.value); if (errField === "email") { setErr(null); setErrField(null); } }} error={errField === "email" ? err ?? undefined : undefined} hint="The gift card code is emailed here once payment is confirmed." />
        <Field label="Personal message" name="gc-msg" hint={`${msg.length}/300`}><textarea id="gc-msg" maxLength={300} value={msg} onChange={(e) => setMsg(e.target.value)} className={textareaCls} /></Field>
        <div className="flex items-center gap-4">
          <div className="flex items-center border border-charcoal/25"><button type="button" aria-label="Decrease quantity" className="h-12 w-10" onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span className="w-8 text-center text-sm" aria-live="polite">{qty}</span><button type="button" aria-label="Increase quantity" className="h-12 w-10" onClick={() => setQty(Math.min(10, qty + 1))}>+</button></div>
          <Button type="submit" size="lg" className="flex-1">Add to bag</Button>
        </div>
        {err && errField !== "email" && <Notice tone="error">{err}</Notice>}
        <p className="text-xs text-charcoal/60">Delivered instantly by email · valid for 12 months · redeemable on anything in the house.</p>
      </form>
    </div>
  );
}
