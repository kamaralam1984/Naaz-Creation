"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { SlidersHorizontal, X, Star } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Facets } from "@/server/catalog";

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return <fieldset className="border-b border-charcoal/10 py-5 first:pt-0"><legend className="eyebrow mb-3 float-left w-full">{title}</legend><div className="clear-both space-y-2">{children}</div></fieldset>;
}
const toggle = (csv: string | null, v: string) => { const a = (csv ?? "").split(",").filter(Boolean); const i = a.indexOf(v); if (i >= 0) a.splice(i, 1); else a.push(v); return a.join(",") || null; };

export function Filters({ facets, showCategories }: { facets: Facets; showCategories: boolean }) {
  const path = usePathname(); const router = useRouter(); const sp = useSearchParams();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [min, setMin] = useState(sp.get("min") ?? ""); const [max, setMax] = useState(sp.get("max") ?? "");
  useEffect(() => { setMin(sp.get("min") ?? ""); setMax(sp.get("max") ?? ""); }, [sp]);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);

  const apply = (patch: Record<string, string | null>) => {
    const u = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) { if (v) u.set(k, v); else u.delete(k); }
    u.delete("page");
    start(() => router.push(`${path}${u.toString() ? `?${u}` : ""}`, { scroll: false }));
  };
  const has = (k: string, v: string) => (sp.get(k) ?? "").split(",").includes(v);
  const count = ["min", "max", "material", "color", "craft", "stock", "rating", "discount", "category"].filter((k) => sp.get(k)).length;

  const check = (k: string, v: string, n?: number) => (
    <label key={v} className="flex cursor-pointer items-center gap-3 text-sm">
      <input type="checkbox" checked={has(k, v)} onChange={() => apply({ [k]: toggle(sp.get(k), v) })} className="h-4 w-4 accent-[var(--burgundy)]" />
      <span className="flex-1">{v}</span>{n != null && <span className="text-xs text-charcoal/50">{n}</span>}
    </label>
  );

  const body = (
    <div className={cn("transition-opacity", pending && "opacity-60")} aria-busy={pending}>
      {showCategories && facets.categories.length > 1 && (
        <Group title="Category">{facets.categories.map((c) => <label key={c.slug} className="flex cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={has("category", c.slug)} onChange={() => apply({ category: toggle(sp.get("category"), c.slug) })} className="h-4 w-4 accent-[var(--burgundy)]" /><span className="flex-1">{c.name}</span><span className="text-xs text-charcoal/50">{c.count}</span></label>)}</Group>
      )}
      <Group title="Price (₹)">
        <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); apply({ min: min || null, max: max || null }); }}>
          <label className="sr-only" htmlFor="pmin">Minimum price</label><input id="pmin" inputMode="numeric" pattern="[0-9]*" placeholder={String(facets.price.min)} value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} className="h-10 w-full border border-charcoal/25 bg-transparent px-3 text-sm" />
          <span aria-hidden>–</span>
          <label className="sr-only" htmlFor="pmax">Maximum price</label><input id="pmax" inputMode="numeric" pattern="[0-9]*" placeholder={String(facets.price.max)} value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} className="h-10 w-full border border-charcoal/25 bg-transparent px-3 text-sm" />
          <button className="h-10 bg-charcoal px-3 text-xs uppercase tracking-[0.14em] text-ivory">Go</button>
        </form>
      </Group>
      {facets.materials.length > 0 && <Group title="Material">{facets.materials.map((m) => check("material", m.value, m.count))}</Group>}
      {facets.colors.length > 0 && <Group title="Colour">{facets.colors.map((m) => check("color", m.value, m.count))}</Group>}
      {facets.crafts.length > 0 && <Group title="Craft">{facets.crafts.map((m) => check("craft", m.value, m.count))}</Group>}
      <Group title="Availability">
        <label className="flex cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={sp.get("stock") === "1"} onChange={(e) => apply({ stock: e.target.checked ? "1" : null })} className="h-4 w-4 accent-[var(--burgundy)]" /> In stock only</label>
      </Group>
      <Group title="Rating">
        {[4, 3].map((r) => <label key={r} className="flex cursor-pointer items-center gap-3 text-sm"><input type="radio" name="rating" checked={sp.get("rating") === String(r)} onChange={() => apply({ rating: String(r) })} className="h-4 w-4 accent-[var(--burgundy)]" /><span className="flex items-center gap-1">{r} <Star size={13} className="fill-champagne text-champagne" aria-hidden /> & up</span></label>)}
        {sp.get("rating") && <button onClick={() => apply({ rating: null })} className="text-xs underline">Clear</button>}
      </Group>
      <Group title="Discount">
        {[10, 20, 30].map((d) => <label key={d} className="flex cursor-pointer items-center gap-3 text-sm"><input type="radio" name="discount" checked={sp.get("discount") === String(d)} onChange={() => apply({ discount: String(d) })} className="h-4 w-4 accent-[var(--burgundy)]" />{d}% or more</label>)}
        {sp.get("discount") && <button onClick={() => apply({ discount: null })} className="text-xs underline">Clear</button>}
      </Group>
      {count > 0 && <button onClick={() => apply({ min: null, max: null, material: null, color: null, craft: null, stock: null, rating: null, discount: null, category: null })} className="mt-5 text-xs uppercase tracking-[0.18em] underline">Clear all filters ({count})</button>}
    </div>
  );

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex h-11 items-center gap-2 border border-charcoal/30 px-4 text-xs uppercase tracking-[0.18em] lg:hidden"><SlidersHorizontal size={15} /> Filters{count > 0 && ` (${count})`}</button>
      <aside aria-label="Filters" className="hidden lg:block">{body}</aside>
      {open && (
        <div className="fixed inset-0 z-[75] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 bg-charcoal/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-ivory">
            <div className="flex items-center justify-between border-b border-charcoal/10 p-5"><h2 className="font-serif text-2xl">Filters</h2><button onClick={() => setOpen(false)} aria-label="Close filters" className="p-2"><X size={20} /></button></div>
            <div className="flex-1 overflow-y-auto p-5">{body}</div>
            <div className="border-t border-charcoal/10 p-4"><button onClick={() => setOpen(false)} className="h-12 w-full bg-burgundy text-xs uppercase tracking-[0.2em] text-ivory">Show results</button></div>
          </div>
        </div>
      )}
    </>
  );
}
