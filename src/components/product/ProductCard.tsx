"use client";
import Link from "next/link";
import { useState } from "react";
import { Eye, Heart, Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";
import { ProductImage } from "@/components/product/ProductImage";
import { useStore } from "@/components/providers/StoreProvider";
import { QuickView } from "@/components/product/QuickView";
import { cn } from "@/lib/cn";
import type { Product } from "@/server/types";

export function badgeFor(p: Product): { label: string; tone: "gold" | "burgundy" | "charcoal" | "outline" } | null {
  if (p.kind === "physical" && p.stock <= 0) return { label: "Sold out", tone: "charcoal" };
  if (p.discount_pct > 0) return { label: `${p.discount_pct}% off`, tone: "burgundy" };
  if (p.badge) return { label: p.badge, tone: "gold" };
  if (p.kind === "physical" && p.stock <= p.low_stock_threshold) return { label: "Few left", tone: "outline" };
  return null;
}

export function ProductCard({ p, priority = false }: { p: Product; priority?: boolean }) {
  const { inWishlist, toggleWishlist, addToCart } = useStore();
  const [qv, setQv] = useState(false);
  const b = badgeFor(p);
  const saved = inWishlist(p.id);
  const soldOut = p.kind === "physical" && p.stock <= 0;
  const needsOptions = p.kind === "giftcard" || p.has_variants;

  return (
    <article className="group relative">
      <div className="gold-corners relative aspect-[4/5] overflow-hidden bg-gradient-to-b from-beige to-[#e2d6c2] transition-shadow duration-500 group-hover:shadow-[var(--shadow-lift)]">
        <Link href={`/product/${p.slug}`} aria-label={p.name} className="absolute inset-0 block">
          {p.images.length > 1 ? (<>
            <div className="absolute inset-0 transition-opacity duration-[600ms] group-hover:opacity-0"><ProductImage p={p} index={0} priority={priority} className="p-5" /></div>
            <div className="absolute inset-0 opacity-0 transition-opacity duration-[600ms] group-hover:opacity-100"><ProductImage p={p} index={1} className="p-5" /></div>
          </>) : (
            <div className="absolute inset-0 transition-transform duration-[700ms] ease-[var(--ease-luxe)] group-hover:scale-[1.12]"><ProductImage p={p} index={0} priority={priority} className="p-5" /></div>
          )}
        </Link>
        {b && <Badge tone={b.tone} className="absolute left-3 top-3">{b.label}</Badge>}
        <button onClick={() => toggleWishlist(p.id)} aria-pressed={saved} aria-label={saved ? `Remove ${p.name} from wishlist` : `Save ${p.name} to wishlist`}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-ivory/90 transition-transform hover:scale-110">
          <Heart size={17} className={cn(saved && "fill-burgundy text-burgundy")} />
        </button>
        <div className="absolute inset-x-0 bottom-0 flex translate-y-full gap-px transition-transform duration-[400ms] ease-[var(--ease-luxe)] group-focus-within:translate-y-0 group-hover:translate-y-0 max-lg:translate-y-0">
          <button onClick={() => setQv(true)} className="flex h-11 flex-1 items-center justify-center gap-2 bg-ivory/95 max-sm:flex-none max-sm:basis-12 text-[0.68rem] uppercase tracking-[0.18em] hover:bg-ivory"><Eye size={14} /> <span className="max-sm:sr-only">Quick view</span></button>
          <button disabled={soldOut}
            onClick={() => (needsOptions ? setQv(true) : addToCart({ productId: p.id, qty: 1 }))}
            className="h-11 flex-1 bg-charcoal text-[0.68rem] uppercase tracking-[0.18em] text-ivory hover:bg-burgundy disabled:opacity-60">
            {soldOut ? "Sold out" : needsOptions ? "Choose" : "Add to bag"}
          </button>
        </div>
      </div>
      <p className="eyebrow mt-4">{p.craft ?? p.category_name}</p>
      <h3 className="mt-1 font-serif text-xl leading-tight transition-colors duration-300 group-hover:text-burgundy"><Link href={`/product/${p.slug}`} className="link-underline">{p.name}</Link></h3>
      <p className="mt-2 flex flex-wrap items-baseline gap-x-2 text-sm">
        {p.has_variants && p.kind === "physical" && <span className="text-charcoal/60">From</span>}
        <span className="font-medium"><Price inr={p.price} /></span>
        {p.compare_at && p.compare_at > p.price && <><s className="text-charcoal/50"><Price inr={p.compare_at} /></s><span className="text-burgundy">{p.discount_pct}% off</span></>}
      </p>
      {p.rating_count > 0 && (
        <p className="mt-1 flex items-center gap-1 text-xs text-charcoal/70" aria-label={`Rated ${p.rating_avg} out of 5 from ${p.rating_count} reviews`}>
          <Star size={13} className="fill-champagne text-champagne" aria-hidden /> {p.rating_avg.toFixed(1)} <span>({p.rating_count})</span>
        </p>
      )}
      {qv && <QuickView slug={p.slug} onClose={() => setQv(false)} />}
    </article>
  );
}
