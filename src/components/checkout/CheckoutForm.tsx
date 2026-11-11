"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import { useQuote } from "@/components/cart/CartDrawer";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { Button } from "@/components/ui/Button";
import { Field, Notice, selectCls, textareaCls } from "@/components/ui/Field";
import { Price } from "@/components/ui/Price";
import { cn } from "@/lib/cn";
import { COUNTRIES, STATES } from "@/lib/geo";

type Addr = { name: string; phone: string; line1: string; line2: string; city: string; state: string; pincode: string; country: string };
type Saved = Addr & { id: number; label: string | null };
const empty: Addr = { name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", country: "India" };

function AddressFields({ v, set, prefix, intl, errors }: { v: Addr; set: (a: Addr) => void; prefix: string; intl: boolean; errors: Record<string, string> }) {
  const up = (k: keyof Addr) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => set({ ...v, [k]: e.target.value });
  const india = v.country === "India";
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Full name" name={`${prefix}name`} value={v.name} onChange={up("name")} autoComplete="name" required error={errors[`${prefix}name`]} />
      <Field label="Phone" name={`${prefix}phone`} value={v.phone} onChange={up("phone")} autoComplete="tel" inputMode="tel" required error={errors[`${prefix}phone`]} />
      <Field label="Address line 1" name={`${prefix}line1`} value={v.line1} onChange={up("line1")} autoComplete="address-line1" required className="sm:col-span-2" error={errors[`${prefix}line1`]} />
      <Field label="Apartment, landmark (optional)" name={`${prefix}line2`} value={v.line2} onChange={up("line2")} autoComplete="address-line2" className="sm:col-span-2" />
      <Field label="City" name={`${prefix}city`} value={v.city} onChange={up("city")} autoComplete="address-level2" required error={errors[`${prefix}city`]} />
      <Field label={india ? "State" : "State / region"} name={`${prefix}state`} error={errors[`${prefix}state`]} required>
        {india ? <select id={`${prefix}state`} value={v.state} onChange={up("state")} className={selectCls} required autoComplete="address-level1"><option value="">Select state</option>{STATES.map((s) => <option key={s}>{s}</option>)}</select>
          : <input id={`${prefix}state`} value={v.state} onChange={up("state")} className={selectCls} required />}
      </Field>
      <Field label={india ? "PIN code" : "Postal code"} name={`${prefix}pincode`} value={v.pincode} onChange={up("pincode")} autoComplete="postal-code" inputMode="numeric" required error={errors[`${prefix}pincode`]} />
      <Field label="Country" name={`${prefix}country`}>
        <select id={`${prefix}country`} value={v.country} onChange={up("country")} className={selectCls} disabled={!intl} autoComplete="country-name">{(intl ? COUNTRIES : ["India"]).map((c) => <option key={c}>{c}</option>)}</select>
      </Field>
    </div>
  );
}

export function CheckoutForm({ user, addresses, intl, giftWrapFee, pointValue, payments }: {
  user: { name: string; email: string; phone: string; points: number } | null; addresses: Saved[]; intl: boolean; giftWrapFee: number; pointValue: number;
  payments: { available: boolean; live: boolean; mock: boolean };
}) {
  const router = useRouter();
  const { cart, ready, clearCart } = useStore();
  const [email, setEmail] = useState(user?.email ?? ""); const [phone, setPhone] = useState(user?.phone ?? "");
  const [ship, setShip] = useState<Addr>(addresses[0] ? { ...addresses[0] } : { ...empty, name: user?.name ?? "" });
  const [bill, setBill] = useState<Addr>(empty); const [same, setSame] = useState(true);
  const [method, setMethod] = useState<"standard" | "express">("standard");
  const [wrap, setWrap] = useState(false); const [gmsg, setGmsg] = useState("");
  const [coupon, setCoupon] = useState(""); const [couponIn, setCouponIn] = useState("");
  const [gc, setGc] = useState(""); const [gcIn, setGcIn] = useState("");
  const [usePts, setUsePts] = useState(false); const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({}); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const [idemKey] = useState(() => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `k${Date.now()}${Math.random().toString(36).slice(2)}`.padEnd(20, "0")));
  const tracked = useRef("");

  useEffect(() => { try { const c = localStorage.getItem("kh_coupon") ?? ""; setCoupon(c); setCouponIn(c); } catch {} }, []);
  const { quote, loading } = useQuote({ couponCode: coupon || null, deliveryMethod: method, country: ship.country, giftWrap: wrap, giftCardCode: gc || null, usePoints: usePts ? user?.points ?? 0 : 0 });
  const digital = quote ? !quote.hasPhysical : false;
  const international = ship.country !== "India";
  useEffect(() => { if (international && method === "express") setMethod("standard"); }, [international, method]);

  const trackCart = () => {
    if (/.+@.+\..+/.test(email) && cart.length && tracked.current !== email) { tracked.current = email; fetch("/api/checkout/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, lines: cart }) }).catch(() => {}); }
  };

  const pick = (id: string) => { const a = addresses.find((x) => String(x.id) === id); if (a) setShip({ ...a }); };

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setErrors({});
    const dummy: Addr = { ...ship, line1: ship.line1 || "Digital delivery", city: ship.city || "—", state: ship.state || "—", pincode: ship.pincode || "000000", name: ship.name || "Customer", phone: ship.phone || phone };
    const shipping = digital ? dummy : ship; const billing = digital || same ? shipping : bill;
    setBusy(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: cart, email, phone, shipping: { ...shipping, line2: shipping.line2 || null }, billing: { ...billing, line2: billing.line2 || null }, deliveryMethod: digital ? "standard" : method, couponCode: coupon || null, giftWrap: wrap, giftMessage: wrap ? gmsg || null : null, giftCardCode: gc || null, usePoints: usePts ? user?.points ?? 0 : 0, notes: notes || null, idempotencyKey: idemKey }),
      });
      const d = await res.json();
      if (!res.ok) { setErr(d.error ?? "Something went wrong."); setBusy(false); return; }
      if (d.gateway) { try { sessionStorage.setItem(`kh_pay_${d.number}`, JSON.stringify({ ...d.gateway, amount: d.amount, email, phone })); } catch {} }
      if (d.paid) { clearCart(); try { localStorage.removeItem("kh_coupon"); } catch {} }
      router.push(`/order/${d.number}?token=${encodeURIComponent(d.token)}${d.paid ? "" : "&pay=1"}`);
    } catch { setErr("Network error — please try again."); setBusy(false); }
  }

  if (!ready) return <p className="mt-10 text-sm text-charcoal/60">Loading…</p>;
  if (!cart.length) return <div className="mt-10 border border-charcoal/10 bg-beige/40 p-10 text-center"><p className="font-serif text-3xl">Your bag is empty</p><Button href="/shop" className="mt-6">Continue shopping</Button></div>;

  const sec = "border-t border-charcoal/10 pt-8";
  const h = "font-serif text-2xl mb-5";
  return (
    <form onSubmit={submit} className="mt-10 grid gap-12 lg:grid-cols-[1fr_400px]" noValidate>
      <div className="space-y-10">
        {!payments.available && <Notice tone="error">Online payments aren&apos;t switched on yet. You can browse and build your bag, but ordering opens once payment keys are added.</Notice>}
        {payments.mock && <Notice>Test mode: payments are simulated — no real money is charged.</Notice>}

        <section>
          <h2 className={h}>Contact</h2>
          {!user && <p className="-mt-3 mb-4 text-sm text-charcoal/65">Have an account? <Link href="/login?next=%2Fcheckout" className="underline">Sign in</Link> for faster checkout, loyalty points and order tracking.</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={trackCart} autoComplete="email" required hint="Order updates are sent here" />
            <Field label="Mobile number" name="phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" required />
          </div>
        </section>

        {!digital && (
          <section className={sec}>
            <h2 className={h}>Shipping address</h2>
            {addresses.length > 0 && (
              <div className="mb-5"><label htmlFor="saved" className="mb-1.5 block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-charcoal/75">Saved addresses</label>
                <select id="saved" onChange={(e) => pick(e.target.value)} className={selectCls} defaultValue={addresses[0].id}>{addresses.map((a) => <option key={a.id} value={a.id}>{a.label ? `${a.label} — ` : ""}{a.name}, {a.line1}, {a.city}</option>)}</select></div>
            )}
            <AddressFields v={ship} set={setShip} prefix="s_" intl={intl} errors={errors} />
            <label className="mt-5 flex items-center gap-3 text-sm"><input type="checkbox" checked={same} onChange={(e) => setSame(e.target.checked)} className="h-4 w-4 accent-[var(--burgundy)]" /> Billing address is the same as shipping</label>
            {!same && <div className="mt-5"><h3 className="mb-4 font-serif text-xl">Billing address</h3><AddressFields v={bill} set={setBill} prefix="b_" intl={intl} errors={errors} /></div>}
          </section>
        )}
        {digital && <section className={sec}><h2 className={h}>Billing name</h2><div className="grid gap-4 sm:grid-cols-2"><Field label="Full name" name="dname" value={ship.name} onChange={(e) => setShip({ ...ship, name: e.target.value })} required autoComplete="name" /></div><p className="mt-3 text-sm text-charcoal/65">Your order is digital — nothing to ship.</p></section>}

        {!digital && (
          <section className={sec}>
            <h2 className={h}>Delivery</h2>
            <div className="grid gap-3">
              {([["standard", "Standard delivery", international ? "7–14 business days" : "5–8 business days"], ["express", "Express delivery", "2–4 business days"]] as const).filter(([k]) => !(international && k === "express")).map(([k, t, d]) => (
                <label key={k} className={cn("flex cursor-pointer items-center gap-4 border p-4", method === k ? "border-charcoal bg-beige/40" : "border-charcoal/20")}>
                  <input type="radio" name="method" checked={method === k} onChange={() => setMethod(k)} className="h-4 w-4 accent-[var(--burgundy)]" />
                  <span className="flex-1"><span className="block text-sm font-medium">{t}</span><span className="text-xs text-charcoal/60">{d}</span></span>
                  <span className="text-sm">{quote ? (k === method ? (quote.shipping === 0 ? "Free" : <Price inr={quote.shipping} />) : "") : ""}</span>
                </label>
              ))}
            </div>
            <label className="mt-5 flex items-start gap-3 text-sm"><input type="checkbox" checked={wrap} onChange={(e) => setWrap(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--burgundy)]" /><span>Gift wrap this order <span className="text-charcoal/60">(+<Price inr={giftWrapFee} />)</span></span></label>
            {wrap && <div className="mt-3"><label htmlFor="gmsg" className="sr-only">Gift message</label><textarea id="gmsg" value={gmsg} onChange={(e) => setGmsg(e.target.value)} maxLength={300} placeholder="Add a handwritten message (optional)" className={textareaCls} /></div>}
            <div className="mt-5"><label htmlFor="notes" className="mb-1.5 block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-charcoal/75">Order notes (optional)</label><textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} className={textareaCls} /></div>
          </section>
        )}

        <section className={sec}>
          <h2 className={h}>Discounts</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label htmlFor="cc" className="mb-1.5 block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-charcoal/75">Coupon code</label>
              <div className="flex gap-2"><input id="cc" value={couponIn} onChange={(e) => setCouponIn(e.target.value.toUpperCase())} className="h-12 flex-1 border border-charcoal/25 bg-transparent px-3 text-sm uppercase" /><button type="button" onClick={() => { setCoupon(couponIn.trim()); try { localStorage.setItem("kh_coupon", couponIn.trim()); } catch {} }} className="h-12 bg-charcoal px-4 text-xs uppercase tracking-[0.14em] text-ivory">Apply</button></div>
              {quote?.couponCode && <p className="mt-1.5 text-sm text-green-800">{quote.couponCode} applied</p>}{quote?.couponError && coupon && <p className="mt-1.5 text-sm text-burgundy">{quote.couponError}</p>}</div>
            <div><label htmlFor="gc" className="mb-1.5 block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-charcoal/75">Gift card</label>
              <div className="flex gap-2"><input id="gc" value={gcIn} onChange={(e) => setGcIn(e.target.value.toUpperCase())} className="h-12 flex-1 border border-charcoal/25 bg-transparent px-3 text-sm uppercase" /><button type="button" onClick={() => setGc(gcIn.trim())} className="h-12 bg-charcoal px-4 text-xs uppercase tracking-[0.14em] text-ivory">Apply</button></div>
              {quote?.giftCardCode && <p className="mt-1.5 text-sm text-green-800">Using <Price inr={quote.giftCardUsed} /> from your gift card</p>}{quote?.giftCardError && gc && <p className="mt-1.5 text-sm text-burgundy">{quote.giftCardError}</p>}</div>
          </div>
          {user && user.points > 0 && <label className="mt-5 flex items-center gap-3 text-sm"><input type="checkbox" checked={usePts} onChange={(e) => setUsePts(e.target.checked)} className="h-4 w-4 accent-[var(--burgundy)]" /> Use my {user.points} loyalty points <span className="text-charcoal/60">(worth up to <Price inr={user.points * pointValue} />, capped per order)</span></label>}
        </section>
      </div>

      <aside className="h-fit border border-charcoal/10 bg-beige/40 p-6 lg:sticky lg:top-28" aria-label="Order summary">
        <h2 className="font-serif text-2xl">Order summary</h2>
        <div className={cn("mt-2", loading && "opacity-60")}>{quote && <OrderSummary q={quote} />}</div>
        {err && <div className="mt-4"><Notice tone="error">{err}</Notice></div>}
        <Button type="submit" size="lg" className="mt-5 w-full" disabled={busy || !quote?.ok || !payments.available || !email || !phone}>
          <Lock size={14} /> {busy ? "Please wait…" : quote && quote.total === 0 ? "Place order" : "Pay securely"}
        </Button>
        <p className="mt-3 text-center text-xs text-charcoal/55">UPI · Cards · Net banking · Wallets — powered by Razorpay. By ordering you agree to our <Link href="/legal/terms" className="underline">terms</Link>.</p>
      </aside>
    </form>
  );
}
