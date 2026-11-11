"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { SORTS } from "@/lib/catalog-params";

export function SortSelect({ defaultSort, withRelevance }: { defaultSort: string; withRelevance?: boolean }) {
  const path = usePathname(); const router = useRouter(); const sp = useSearchParams(); const [, start] = useTransition();
  const opts = withRelevance ? [{ value: "relevance", label: "Most relevant" }, ...SORTS] : SORTS;
  return (
    <label className="flex items-center gap-3 text-sm">
      <span className="hidden text-xs uppercase tracking-[0.16em] text-charcoal/60 sm:inline">Sort by</span>
      <select value={sp.get("sort") ?? defaultSort} className="h-11 border border-charcoal/30 bg-transparent px-3"
        onChange={(e) => { const u = new URLSearchParams(sp.toString()); u.set("sort", e.target.value); u.delete("page"); start(() => router.push(`${path}?${u}`, { scroll: false })); }}>
        {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
