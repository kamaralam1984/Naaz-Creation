"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { ProductArt } from "@/components/product/ProductArt";
import { Price } from "@/components/ui/Price";
import { Container } from "@/components/ui/Container";

type Sug = { products: { slug: string; name: string; price: number; craft: string | null; tone: "clay" | "brass" | "wine" | "sand" | "ink"; category_slug: string | null; image: string | null }[]; categories: { slug: string; name: string }[] };
const POPULAR = ["Golden straw", "Madhubani", "Mirror work", "Cushion", "Tree of life"];

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [s, setS] = useState<Sug>({ products: [], categories: [] });
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) setTimeout(() => input.current?.focus(), 60); else setQ(""); }, [open]);
  useEffect(() => { const f = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f); }, [onClose]);
  useEffect(() => {
    if (q.trim().length < 2) { setS({ products: [], categories: [] }); return; }
    const ctl = new AbortController();
    const t = setTimeout(() => fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`, { signal: ctl.signal }).then((r) => r.json()).then(setS).catch(() => {}), 180);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [q]);

  const go = (term: string) => { onClose(); router.push(`/search?q=${encodeURIComponent(term)}`); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div role="dialog" aria-modal="true" aria-label="Search" className="fixed inset-0 z-[80] overflow-y-auto bg-ivory text-charcoal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <Container className="max-w-4xl py-8">
            <div className="flex items-center gap-4 border-b border-charcoal pb-4">
              <Search size={22} aria-hidden />
              <form className="flex-1" onSubmit={(e) => { e.preventDefault(); if (q.trim()) go(q.trim()); }} role="search">
                <label htmlFor="site-search" className="sr-only">Search the house</label>
                <input id="site-search" ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search frames, cushions, mirrors…" autoComplete="off" className="w-full bg-transparent font-serif text-2xl sm:text-3xl placeholder:text-charcoal/35 focus:outline-none sm:text-4xl" />
              </form>
              <button onClick={onClose} aria-label="Close search" className="p-2"><X size={24} /></button>
            </div>

            {q.trim().length < 2 ? (
              <div className="mt-10">
                <p className="eyebrow">Popular searches</p>
                <ul className="mt-4 flex flex-wrap gap-3">{POPULAR.map((p) => <li key={p}><button onClick={() => go(p)} className="border border-charcoal/25 px-4 py-2 text-sm hover:bg-charcoal hover:text-ivory">{p}</button></li>)}</ul>
              </div>
            ) : (
              <div className="mt-8 grid gap-10 md:grid-cols-[1fr_2fr]">
                <div>
                  <p className="eyebrow">Categories</p>
                  <ul className="mt-4 space-y-2">
                    {s.categories.length ? s.categories.map((c) => <li key={c.slug}><Link href={`/category/${c.slug}`} onClick={onClose} className="link-underline font-serif text-xl">{c.name}</Link></li>) : <li className="text-sm text-charcoal/60">No matching categories</li>}
                  </ul>
                </div>
                <div>
                  <p className="eyebrow">Products</p>
                  <ul className="mt-4 divide-y divide-charcoal/10">
                    {s.products.map((p) => (
                      <li key={p.slug}>
                        <Link href={`/product/${p.slug}`} onClick={onClose} className="flex items-center gap-4 py-3">
                          <span className="h-16 w-14 shrink-0 overflow-hidden">{p.image ? <img src={p.image} alt="" className="h-full w-full object-contain" /> : <ProductArt tone={p.tone} kind={p.category_slug ?? "default"} />}</span>
                          <span className="flex-1"><span className="block font-serif text-lg leading-tight">{p.name}</span><span className="text-xs uppercase tracking-[0.14em] text-charcoal/55">{p.craft}</span></span>
                          <Price inr={p.price} className="text-sm" />
                        </Link>
                      </li>
                    ))}
                    {!s.products.length && <li className="py-3 text-sm text-charcoal/60">No products found for “{q}”.</li>}
                  </ul>
                  {s.products.length > 0 && <button onClick={() => go(q.trim())} className="link-underline mt-4 text-xs uppercase tracking-[0.2em]">See all results</button>}
                </div>
              </div>
            )}
          </Container>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
