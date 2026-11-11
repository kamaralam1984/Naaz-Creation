"use client";
/* eslint-disable react/no-unescaped-entities */
import { useState } from "react";
import { Check } from "lucide-react";
import { EnquiryForm } from "./EnquiryForm";
import { ProductArt } from "@/components/product/ProductArt";
import { Price } from "@/components/ui/Price";
import { cn } from "@/lib/cn";

type Item = { id: number; slug: string; name: string; price: number; craft: string | null; tone: "clay" | "brass" | "wine" | "sand" | "ink"; category: string | null; image: string | null };
const THEMES = ["Wedding", "Diwali & festive", "Housewarming", "Anniversary", "Corporate", "Birthday", "Just because"];

export function HamperBuilder({ items }: { items: Item[] }) {
  const [theme, setTheme] = useState(THEMES[0]);
  const [picked, setPicked] = useState<number[]>([]);
  const chosen = items.filter((i) => picked.includes(i.id));
  const total = chosen.reduce((s, i) => s + i.price, 0);
  const toggle = (id: number) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 6 ? p : [...p, id]));

  return (
    <div className="space-y-14">
      <section aria-labelledby="h-theme">
        <h2 id="h-theme" className="font-serif text-3xl">1 · Choose an occasion</h2>
        <div className="mt-5 flex flex-wrap gap-3">{THEMES.map((t) => <button key={t} aria-pressed={theme === t} onClick={() => setTheme(t)} className={cn("h-11 border px-5 text-sm transition-colors", theme === t ? "border-charcoal bg-charcoal text-ivory" : "border-charcoal/30 hover:border-charcoal")}>{t}</button>)}</div>
      </section>
      <section aria-labelledby="h-pick">
        <div className="flex flex-wrap items-end justify-between gap-3"><h2 id="h-pick" className="font-serif text-3xl">2 · Pick up to six pieces</h2><p className="text-sm text-charcoal/65" aria-live="polite">{picked.length}/6 selected{total > 0 && <> · approx. <Price inr={total} /></>}</p></div>
        <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((i) => { const on = picked.includes(i.id); return (
            <li key={i.id}>
              <button onClick={() => toggle(i.id)} aria-pressed={on} className={cn("group relative block w-full text-left outline-offset-4", on && "ring-2 ring-burgundy ring-offset-2 ring-offset-ivory")}>
                <span className="relative block aspect-square overflow-hidden">{i.image ? <img src={i.image} alt="" className="h-full w-full object-contain" /> /* eslint-disable-line */ : <ProductArt tone={i.tone} kind={i.category ?? "default"} />}{on && <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-burgundy text-ivory"><Check size={15} /></span>}</span>
                <span className="mt-2 block font-serif text-lg leading-tight">{i.name}</span>
                <span className="text-xs text-charcoal/65"><Price inr={i.price} /></span>
              </button>
            </li>); })}
        </ul>
      </section>
      <section aria-labelledby="h-send">
        <h2 id="h-send" className="font-serif text-3xl">3 · Tell us the rest</h2>
        <p className="mb-6 mt-2 max-w-xl text-sm text-charcoal/70">We'll send a tailored proposal with packaging options, personalised notes and pricing within one working day.</p>
        <EnquiryForm kind="custom" details={{ theme, products: chosen.map((c) => ({ id: c.id, name: c.name, price: c.price })) }} submitLabel="Request my hamper proposal" messageLabel="Recipients, preferences, personal note" />
      </section>
    </div>
  );
}
