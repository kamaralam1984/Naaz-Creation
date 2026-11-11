"use client";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { useStore } from "@/components/providers/StoreProvider";
import type { Product } from "@/server/types";

export function RecentlyViewed({ excludeId }: { excludeId?: number }) {
  const { recent, ready } = useStore();
  const [items, setItems] = useState<Product[]>([]);
  const ids = recent.filter((i) => i !== excludeId).slice(0, 4);
  const key = ids.join(",");
  useEffect(() => {
    if (!ready || !key) { setItems([]); return; }
    fetch(`/api/products/by-ids?ids=${key}`).then((r) => r.json()).then((d) => setItems(d.products ?? [])).catch(() => {});
  }, [key, ready]);
  if (!items.length) return null;
  return (
    <section className="mt-24" aria-labelledby="rv-h">
      <p className="eyebrow">Pick up where you left off</p>
      <h2 id="rv-h" className="mt-2 text-[length:var(--text-h3)]">Recently viewed</h2>
      <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">{items.map((p) => <li key={p.id}><ProductCard p={p} /></li>)}</ul>
    </section>
  );
}
