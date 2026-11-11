"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Heart, ShoppingCart, Star } from "lucide-react";
import { Price } from "@/components/ui/Price";
import { QuickView } from "@/components/product/QuickView";
import { useStore } from "@/components/providers/StoreProvider";
import { cn } from "@/lib/cn";
import type { Product } from "@/server/types";

type Tabs = { best: Product[]; fresh: Product[]; sale: Product[] };
const LABELS = [["best", "Bestsellers"], ["fresh", "New Arrivals"], ["sale", "On Sale"]] as const;

function Card({ p }: { p: Product }) {
  const { inWishlist, toggleWishlist, addToCart } = useStore();
  const [qv, setQv] = useState(false);
  const saved = inWishlist(p.id);
  const soldOut = p.kind === "physical" && p.stock <= 0;
  const needsOptions = p.kind === "giftcard" || p.has_variants;
  const sub = p.colors.slice(0, 2).join(" & ") || p.craft || "";
  return (
    <article className="group w-[46%] shrink-0 snap-start rounded-md bg-white p-2.5 shadow-[0_2px_14px_-6px_rgb(38_35_31/0.25)] transition-shadow duration-300 hover:shadow-[var(--shadow-lift)] sm:w-[31%] lg:w-[calc((100%-5*1rem)/6)]">
      <div className="gold-corners relative aspect-[4/3] overflow-hidden rounded-[3px] bg-gradient-to-b from-[#f4e9d8] to-[#ead9bf]">
        <a href={`/product/${p.slug}`} aria-label={p.name} className="absolute inset-0 block">
          <Image src={p.images[0]} alt={p.name} fill sizes="(min-width:1024px) 16vw, 46vw" className="object-contain p-2 transition-transform duration-700 group-hover:scale-110" />
        </a>
        <button onClick={() => toggleWishlist(p.id)} aria-pressed={saved} aria-label={saved ? `Remove ${p.name} from wishlist` : `Save ${p.name}`} className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 transition-transform hover:scale-110">
          <Heart size={14} className={cn(saved && "fill-red-600 text-red-600")} />
        </button>
      </div>
      <h3 className="mt-3 line-clamp-1 font-sans text-[0.8rem] font-semibold leading-tight text-charcoal">{p.name}</h3>
      <p className="line-clamp-1 text-[0.68rem] text-charcoal/60">({sub})</p>
      <p className="mt-1 flex items-center gap-1 text-[0.68rem] text-charcoal/70">
        <span className="flex text-champagne">{[0, 1, 2, 3, 4].map((k) => <Star key={k} size={11} className={cn(k < Math.round(p.rating_avg || 5) ? "fill-champagne" : "fill-none")} />)}</span>
        ({p.rating_count || 12})
      </p>
      <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5 text-[0.85rem]">
        <span className="font-semibold"><Price inr={p.price} /></span>
        {p.compare_at && p.compare_at > p.price && <><s className="text-[0.68rem] text-charcoal/45"><Price inr={p.compare_at} /></s><span className="text-[0.68rem] font-medium text-red-600">{p.discount_pct}% Off</span></>}
      </p>
      <button disabled={soldOut} onClick={() => (needsOptions ? setQv(true) : addToCart({ productId: p.id, qty: 1 }))}
        className="mt-2.5 flex h-8 w-full items-center justify-center gap-1.5 rounded-[3px] bg-[#0f3d2e] text-[0.7rem] font-medium text-ivory transition-colors hover:bg-[#145240] disabled:opacity-60">
        <ShoppingCart size={13} /> {soldOut ? "Sold out" : needsOptions ? "Choose Options" : "Add to Cart"}
      </button>
      {qv && <QuickView slug={p.slug} onClose={() => setQv(false)} />}
    </article>
  );
}

export function BestsellerTabs({ data }: { data: Tabs }) {
  const [tab, setTab] = useState<keyof Tabs>("best");
  const rail = useRef<HTMLDivElement>(null);
  const scroll = (d: number) => rail.current?.scrollBy({ left: d * rail.current.clientWidth * 0.8, behavior: "smooth" });
  const list = data[tab].length ? data[tab] : data.best;
  return (
    <div>
      <div className="flex justify-center gap-2 sm:justify-end" role="tablist" aria-label="Product lists">
        {LABELS.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={cn("h-10 rounded-[3px] border px-4 text-xs font-medium transition-all duration-300", tab === k ? "border-[#0f3d2e] bg-[#7a3e1d] text-ivory shadow-md" : "border-charcoal/15 bg-white text-charcoal hover:border-champagne-deep")}>{l}</button>
        ))}
      </div>
      <div className="relative mt-5">
        <button onClick={() => scroll(-1)} aria-label="Scroll left" className="absolute -left-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg transition-transform hover:scale-110 lg:flex"><ChevronLeft size={18} /></button>
        <div ref={rail} key={tab} className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {list.map((p) => <Card key={p.id} p={p} />)}
        </div>
        <button onClick={() => scroll(1)} aria-label="Scroll right" className="absolute -right-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg transition-transform hover:scale-110 lg:flex"><ChevronRight size={18} /></button>
      </div>
    </div>
  );
}
