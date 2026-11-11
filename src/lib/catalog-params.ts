import type { ListOptions, SortKey } from "@/server/catalog";

export type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const list = (v: string | string[] | undefined) => (v == null ? [] : (Array.isArray(v) ? v.flatMap((x) => x.split(",")) : v.split(",")).map((s) => s.trim()).filter(Boolean)).slice(0, 12);
const int = (v: string | string[] | undefined) => { const n = Number(one(v)); return Number.isFinite(n) && n >= 0 && one(v) !== "" && one(v) != null ? Math.floor(n) : undefined; };

export const SORTS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" }, { value: "newest", label: "Newest" }, { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" }, { value: "best_selling", label: "Best selling" }, { value: "top_rated", label: "Top rated" },
];
const SORT_KEYS = new Set<string>([...SORTS.map((s) => s.value), "relevance"]);

export function parseListParams(sp: SP, base: ListOptions = {}, defaultSort: SortKey = "featured"): ListOptions {
  const sort = one(sp.sort);
  const cat = list(sp.category);
  return {
    ...base,
    q: (one(sp.q) ?? base.q)?.trim().slice(0, 80) || undefined,
    category: base.category?.length ? base.category : cat.length ? cat : undefined,
    minPrice: int(sp.min), maxPrice: int(sp.max),
    material: list(sp.material), color: list(sp.color), craft: list(sp.craft),
    inStock: one(sp.stock) === "1",
    minRating: int(sp.rating), minDiscount: int(sp.discount),
    sort: (sort && SORT_KEYS.has(sort) ? (sort as SortKey) : defaultSort),
    page: Math.max(int(sp.page) ?? 1, 1),
    perPage: 12,
  };
}

export function activeFilterCount(sp: SP) {
  return ["min", "max", "material", "color", "craft", "stock", "rating", "discount", "category"].filter((k) => one(sp[k])).length;
}
export function withParams(sp: SP, patch: Record<string, string | null>) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) { const x = one(v); if (x != null && x !== "") u.set(k, x); }
  for (const [k, v] of Object.entries(patch)) { if (v == null || v === "") u.delete(k); else u.set(k, v); }
  const s = u.toString();
  return s ? `?${s}` : "";
}
