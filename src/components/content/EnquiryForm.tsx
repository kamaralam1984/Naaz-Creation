"use client";
/* eslint-disable react/no-unescaped-entities */
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Notice, selectCls, textareaCls } from "@/components/ui/Field";

type Kind = "corporate" | "bulk" | "custom" | "contact";
const TIERS: [string, number][] = [["25 – 49 gifts", 25], ["50 – 99 gifts", 50], ["100 – 249 gifts", 100], ["250 – 499 gifts", 250], ["500+ gifts", 500]];
const BUDGETS = ["Under ₹1,000 per gift", "₹1,000 – ₹2,500 per gift", "₹2,500 – ₹5,000 per gift", "₹5,000 – ₹10,000 per gift", "₹10,000+ per gift"];
const TIMELINES = ["Within 2 weeks", "2 – 4 weeks", "1 – 2 months", "Flexible"];
const TOPICS = ["Order help", "Product question", "Shipping & delivery", "Returns & refunds", "Wholesale", "Something else"];

export function EnquiryForm({ kind, details = {}, submitLabel = "Send enquiry", successTitle = "Thank you — we've got it", messageLabel = "Tell us more" }: { kind: Kind; details?: Record<string, unknown>; submitLabel?: string; successTitle?: string; messageLabel?: string }) {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<{ msg: string; field?: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const s = (k: string) => String(f.get(k) ?? "").trim();
    const extra: Record<string, unknown> = { ...details };
    let quantity: number | undefined;
    if (kind === "corporate") {
      quantity = Number(s("tier")) || undefined; extra.tier = TIERS.find((t) => t[1] === quantity)?.[0];
      extra.customLogo = f.get("logo") === "on"; extra.logoNotes = s("logoNotes"); extra.timeline = s("timeline"); extra.contactRole = s("role");
    }
    if (kind === "bulk") { quantity = Number(s("quantity")) || undefined; extra.interest = s("interest"); extra.timeline = s("timeline"); }
    if (kind === "custom") { quantity = Number(s("recipients")) || undefined; extra.timeline = s("timeline"); }
    if (kind === "contact") extra.topic = s("topic");
    setState("sending"); setError(null);
    try {
      const res = await fetch("/api/enquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: kind, name: s("name"), email: s("email"), phone: s("phone"), company: s("company") || undefined, quantity, budget: s("budget") || undefined, message: s("message") || undefined, details: extra, website: s("website") }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setError({ msg: d.error ?? "Something went wrong. Please try again.", field: d.field }); setState("idle"); return; }
      setState("done");
    } catch { setError({ msg: "Network error. Please try again." }); setState("idle"); }
  }

  if (state === "done") return <div role="status" className="border border-champagne-deep/40 bg-beige/60 p-8"><p className="font-serif text-3xl">{successTitle}</p><p className="mt-3 text-sm text-charcoal/75">A confirmation is on its way to your inbox. Our team will reply within one working day.</p></div>;
  const fe = (n: string) => (error?.field === n ? error.msg : undefined);

  return (
    <form onSubmit={onSubmit} noValidate={false} className="grid gap-5 sm:grid-cols-2">
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <Field label="Your name" name="name" required autoComplete="name" error={fe("name")} />
      <Field label="Email" name="email" type="email" required autoComplete="email" error={fe("email")} />
      <Field label="Phone" name="phone" type="tel" autoComplete="tel" required={kind !== "contact"} error={fe("phone")} />
      {(kind === "corporate" || kind === "bulk") && <Field label="Company" name="company" required={kind === "corporate"} autoComplete="organization" />}
      {kind === "corporate" && <Field label="Your role" name="role" autoComplete="organization-title" />}
      {kind === "corporate" && <Field label="Quantity" name="tier"><select id="tier" name="tier" required className={selectCls} defaultValue=""><option value="" disabled>Select a range</option>{TIERS.map(([l, v]) => <option key={v} value={v}>{l}</option>)}</select></Field>}
      {kind === "bulk" && <Field label="Quantity" name="quantity" type="number" min={10} max={100000} required hint="Minimum 10 pieces" error={fe("quantity")} />}
      {kind === "bulk" && <Field label="Products of interest" name="interest" placeholder="e.g. copper bottles, brass diyas" />}
      {kind === "custom" && <Field label="Number of hampers" name="recipients" type="number" min={1} max={5000} required />}
      {(kind === "corporate" || kind === "bulk" || kind === "custom") && <Field label="Budget" name="budget"><select id="budget" name="budget" className={selectCls} defaultValue=""><option value="">Select (optional)</option>{BUDGETS.map((b) => <option key={b}>{b}</option>)}</select></Field>}
      {(kind === "corporate" || kind === "bulk" || kind === "custom") && <Field label="Needed by" name="timeline"><select id="timeline" name="timeline" className={selectCls} defaultValue=""><option value="">Select (optional)</option>{TIMELINES.map((b) => <option key={b}>{b}</option>)}</select></Field>}
      {kind === "contact" && <Field label="Topic" name="topic" className="sm:col-span-2"><select id="topic" name="topic" className={selectCls}>{TOPICS.map((b) => <option key={b}>{b}</option>)}</select></Field>}
      {kind === "corporate" && (
        <fieldset className="sm:col-span-2 border border-charcoal/15 p-4">
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" name="logo" className="h-4 w-4 accent-[var(--burgundy)]" /> I'd like custom logo printing / engraving</label>
          <label htmlFor="logoNotes" className="sr-only">Logo details</label>
          <input id="logoNotes" name="logoNotes" placeholder="Where should the logo go? Colours, file format, etc." className="mt-3 h-11 w-full border border-charcoal/25 bg-transparent px-3 text-sm" />
        </fieldset>
      )}
      <Field label={messageLabel} name="message" className="sm:col-span-2" error={fe("message")}><textarea id="message" name="message" required={kind === "contact"} maxLength={2000} className={textareaCls} /></Field>
      {error && !error.field && <div className="sm:col-span-2"><Notice tone="error">{error.msg}</Notice></div>}
      <div className="sm:col-span-2"><Button type="submit" size="lg" disabled={state === "sending"}>{state === "sending" ? "Sending…" : submitLabel}</Button></div>
    </form>
  );
}
