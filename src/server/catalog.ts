import { all, get, json, run, type Param } from "./db";
import type { Artisan, Category, Collection, Product, ProductRow, Review, Variant } from "./types";

type Joined = ProductRow & { category_name: string | null; category_slug: string | null; variant_count?: number; min_price?: number | null };

export function toProduct(r: Joined): Product {
  const { colors, images, specs, variant_count, min_price, ...rest } = r;
  const price = min_price != null && min_price < r.price ? min_price : r.price;
  return {
    ...rest,
    price,
    has_variants: (variant_count ?? 0) > 0,
    colors: json<string[]>(colors, []),
    images: json<string[]>(images, []),
    specs: json<{ label: string; value: string }[]>(specs, []),
    discount_pct: r.compare_at && r.compare_at > price ? Math.round((1 - price / r.compare_at) * 100) : 0,
  };
}

const SELECT = `SELECT p.*, c.name AS category_name, c.slug AS category_slug, (SELECT COUNT(*) FROM variants v WHERE v.product_id = p.id) AS variant_count, (SELECT MIN(COALESCE(v.price, p.price)) FROM variants v WHERE v.product_id = p.id) AS min_price FROM products p LEFT JOIN categories c ON c.id = p.category_id`;
const NEW_DAYS = 45;

export type SortKey = "featured" | "newest" | "price_asc" | "price_desc" | "best_selling" | "top_rated" | "relevance";
export type Flag = "bestseller" | "new" | "sale" | "featured";
export type ListOptions = {
  q?: string; category?: string[]; collection?: string; flag?: Flag;
  minPrice?: number; maxPrice?: number; material?: string[]; color?: string[]; craft?: string[];
  inStock?: boolean; minRating?: number; minDiscount?: number;
  sort?: SortKey; page?: number; perPage?: number; includeInactive?: boolean; ids?: number[];
};

function scope(o: ListOptions, withFilters: boolean) {
  const w: string[] = ["p.kind = 'physical'"];
  const p: Param[] = [];
  if (!o.includeInactive) w.push("p.is_active = 1");
  if (o.ids?.length) { w.push(`p.id IN (${o.ids.map(() => "?").join(",")})`); p.push(...o.ids); }
  if (o.category?.length) { w.push(`c.slug IN (${o.category.map(() => "?").join(",")})`); p.push(...o.category); }
  if (o.collection) { w.push("EXISTS (SELECT 1 FROM product_collections pc JOIN collections co ON co.id = pc.collection_id WHERE pc.product_id = p.id AND co.slug = ?)"); p.push(o.collection); }
  if (o.q) {
    const like = `%${o.q.replace(/[%_]/g, "")}%`;
    w.push("(p.name LIKE ? OR p.description LIKE ? OR p.craft LIKE ? OR p.material LIKE ? OR c.name LIKE ?)");
    p.push(like, like, like, like, like);
  }
  if (o.flag === "sale") w.push("p.compare_at IS NOT NULL AND p.compare_at > p.price");
  if (o.flag === "featured") w.push("p.is_featured = 1");
  if (o.flag === "bestseller") w.push("p.sold_count > 0");
  if (o.flag === "new") { w.push("p.created_at >= datetime('now', ?)"); p.push(`-${NEW_DAYS} days`); }
  if (withFilters) {
    if (o.minPrice != null) { w.push("p.price >= ?"); p.push(o.minPrice); }
    if (o.maxPrice != null) { w.push("p.price <= ?"); p.push(o.maxPrice); }
    if (o.material?.length) { w.push(`p.material IN (${o.material.map(() => "?").join(",")})`); p.push(...o.material); }
    if (o.craft?.length) { w.push(`p.craft IN (${o.craft.map(() => "?").join(",")})`); p.push(...o.craft); }
    if (o.color?.length) { w.push("(" + o.color.map(() => "p.colors LIKE ?").join(" OR ") + ")"); p.push(...o.color.map((c) => `%"${c.replace(/["%_]/g, "")}"%`)); }
    if (o.inStock) w.push("p.stock > 0");
    if (o.minRating) { w.push("p.rating_avg >= ?"); p.push(o.minRating); }
    if (o.minDiscount) { w.push("p.compare_at IS NOT NULL AND p.compare_at > 0 AND (1.0 - 1.0 * p.price / p.compare_at) * 100 >= ?"); p.push(o.minDiscount); }
  }
  return { where: "WHERE " + w.join(" AND "), params: p };
}

const ORDER: Record<SortKey, string> = {
  featured: "p.is_featured DESC, p.sold_count DESC, p.id DESC",
  newest: "p.created_at DESC, p.id DESC",
  price_asc: "p.price ASC",
  price_desc: "p.price DESC",
  best_selling: "p.sold_count DESC, p.rating_avg DESC",
  top_rated: "p.rating_avg DESC, p.rating_count DESC",
  relevance: "(CASE WHEN p.name LIKE ? THEN 0 ELSE 1 END), p.sold_count DESC",
};

export type Facets = {
  categories: { slug: string; name: string; count: number }[];
  materials: { value: string; count: number }[];
  colors: { value: string; count: number }[];
  crafts: { value: string; count: number }[];
  price: { min: number; max: number };
};

export function listProducts(o: ListOptions = {}) {
  const perPage = Math.min(Math.max(o.perPage ?? 12, 1), 48);
  const page = Math.max(o.page ?? 1, 1);
  const { where, params } = scope(o, true);
  const total = get<{ n: number }>(`SELECT COUNT(*) AS n FROM products p LEFT JOIN categories c ON c.id = p.category_id ${where}`, ...params)!.n;
  const sort: SortKey = o.sort === "relevance" && !o.q ? "featured" : (o.sort ?? (o.q ? "relevance" : "featured"));
  const orderParams: Param[] = sort === "relevance" ? [`${(o.q ?? "").replace(/[%_]/g, "")}%`] : [];
  const rows = all<Joined>(`${SELECT} ${where} ORDER BY ${ORDER[sort]} LIMIT ? OFFSET ?`, ...params, ...orderParams, perPage, (page - 1) * perPage);
  return { items: rows.map(toProduct), total, page, perPage, pages: Math.max(Math.ceil(total / perPage), 1) };
}

/** Filter options for the current scope (category/collection/flag/search), ignoring the user's own filters. */
export function getFacets(o: ListOptions = {}): Facets {
  const { where, params } = scope({ ...o, minPrice: undefined, maxPrice: undefined }, false);
  const rows = all<{ material: string | null; craft: string | null; colors: string; price: number; cslug: string | null; cname: string | null }>(
    `SELECT p.material, p.craft, p.colors, p.price, c.slug AS cslug, c.name AS cname FROM products p LEFT JOIN categories c ON c.id = p.category_id ${where}`, ...params);
  const tally = (vals: (string | null)[]) => {
    const m = new Map<string, number>();
    for (const v of vals) if (v) m.set(v, (m.get(v) ?? 0) + 1);
    return [...m].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
  };
  const cats = new Map<string, { slug: string; name: string; count: number }>();
  for (const r of rows) if (r.cslug) { const c = cats.get(r.cslug) ?? { slug: r.cslug, name: r.cname!, count: 0 }; c.count++; cats.set(r.cslug, c); }
  const prices = rows.map((r) => r.price);
  return {
    categories: [...cats.values()].sort((a, b) => b.count - a.count),
    materials: tally(rows.map((r) => r.material)),
    colors: tally(rows.flatMap((r) => json<string[]>(r.colors, []))),
    crafts: tally(rows.map((r) => r.craft)),
    price: { min: prices.length ? Math.min(...prices) : 0, max: prices.length ? Math.max(...prices) : 0 },
  };
}

export function getProductBySlug(slug: string, includeInactive = false): Product | null {
  const r = get<Joined>(`${SELECT} WHERE p.slug = ? ${includeInactive ? "" : "AND p.is_active = 1"}`, slug);
  return r ? toProduct(r) : null;
}
export function getProductById(id: number): Product | null {
  const r = get<Joined>(`${SELECT} WHERE p.id = ?`, id);
  return r ? toProduct(r) : null;
}
export function getProductsByIds(ids: number[]): Product[] {
  if (!ids.length) return [];
  const rows = all<Joined>(`${SELECT} WHERE p.id IN (${ids.map(() => "?").join(",")}) AND p.is_active = 1`, ...ids);
  const byId = new Map(rows.map((r) => [r.id, toProduct(r)]));
  return ids.map((i) => byId.get(i)).filter(Boolean) as Product[];
}
export const getVariants = (productId: number) => all<Variant>("SELECT * FROM variants WHERE product_id = ? ORDER BY sort, id", productId);
export const getProductCollections = (productId: number) => all<Collection>("SELECT c.* FROM collections c JOIN product_collections pc ON pc.collection_id = c.id WHERE pc.product_id = ?", productId);

export function relatedProducts(p: Product, n = 4): Product[] {
  const rows = all<Joined>(`${SELECT} WHERE p.is_active = 1 AND p.kind='physical' AND p.id != ? ORDER BY (p.category_id = ?) DESC, (p.craft = ?) DESC, p.sold_count DESC LIMIT ?`, p.id, p.category_id ?? -1, p.craft ?? "", n);
  return rows.map(toProduct);
}

export const getApprovedReviews = (productId: number) => all<Review>("SELECT * FROM reviews WHERE product_id = ? AND status = 'approved' ORDER BY created_at DESC", productId);
export function recalcRating(productId: number) {
  const r = get<{ a: number | null; n: number }>("SELECT AVG(rating) AS a, COUNT(*) AS n FROM reviews WHERE product_id = ? AND status = 'approved'", productId)!;
  run("UPDATE products SET rating_avg = ?, rating_count = ? WHERE id = ?", Math.round((r.a ?? 0) * 10) / 10, r.n, productId);
}

export const getCategories = () => all<Category & { count: number }>("SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = 1) AS count FROM categories c ORDER BY c.sort, c.name");
export const getCategory = (slug: string) => get<Category>("SELECT * FROM categories WHERE slug = ?", slug);
export const getCollections = (featuredOnly = false) => all<Collection & { count: number }>(`SELECT c.*, (SELECT COUNT(*) FROM product_collections pc JOIN products p ON p.id = pc.product_id WHERE pc.collection_id = c.id AND p.is_active = 1) AS count FROM collections c WHERE c.is_active = 1 ${featuredOnly ? "AND c.is_featured = 1" : ""} ORDER BY c.sort, c.name`);
export const getCollection = (slug: string) => get<Collection>("SELECT * FROM collections WHERE slug = ? AND is_active = 1", slug);
export const getArtisans = () => all<Artisan>("SELECT * FROM artisans ORDER BY name");
export const getArtisan = (slug: string) => get<Artisan>("SELECT * FROM artisans WHERE slug = ?", slug);
export const getArtisanById = (id: number) => get<Artisan>("SELECT * FROM artisans WHERE id = ?", id);
export const productsByArtisan = (id: number) => all<Joined>(`${SELECT} WHERE p.artisan_id = ? AND p.is_active = 1`, id).map(toProduct);

export function suggest(q: string) {
  const like = `%${q.replace(/[%_]/g, "")}%`;
  const products = all<Joined>(`${SELECT} WHERE p.is_active = 1 AND p.kind='physical' AND (p.name LIKE ? OR p.craft LIKE ? OR p.material LIKE ?) ORDER BY (p.name LIKE ?) DESC, p.sold_count DESC LIMIT 6`, like, like, like, `${q.replace(/[%_]/g, "")}%`).map(toProduct);
  const categories = all<Category>("SELECT * FROM categories WHERE name LIKE ? LIMIT 3", like);
  return { products, categories };
}

export const lowStock = () => all<ProductRow>("SELECT * FROM products WHERE kind='physical' AND stock <= low_stock_threshold ORDER BY stock ASC LIMIT 20");
export const isNew = (p: Pick<ProductRow, "created_at">) => Date.now() - new Date(p.created_at.replace(" ", "T") + "Z").getTime() < NEW_DAYS * 864e5;

/* ───────── per-user lists ───────── */
export const wishlistIds = (userId: number) => all<{ product_id: number }>("SELECT product_id FROM wishlist WHERE user_id = ? ORDER BY created_at DESC", userId).map((r) => r.product_id);
export const wishlistProducts = (userId: number) => getProductsByIds(wishlistIds(userId));
export function toggleWishlist(userId: number, productId: number): boolean {
  if (get("SELECT 1 FROM wishlist WHERE user_id = ? AND product_id = ?", userId, productId)) { run("DELETE FROM wishlist WHERE user_id = ? AND product_id = ?", userId, productId); return false; }
  if (!get("SELECT 1 FROM products WHERE id = ?", productId)) return false;
  run("INSERT INTO wishlist(user_id, product_id) VALUES(?,?)", userId, productId);
  return true;
}
export function pushRecentlyViewed(userId: number, productId: number) {
  run("INSERT INTO recently_viewed(user_id, product_id) VALUES(?,?) ON CONFLICT(user_id, product_id) DO UPDATE SET viewed_at = datetime('now')", userId, productId);
  run("DELETE FROM recently_viewed WHERE user_id = ? AND product_id NOT IN (SELECT product_id FROM recently_viewed WHERE user_id = ? ORDER BY viewed_at DESC LIMIT 20)", userId, userId);
}
export const recentlyViewedProducts = (userId: number, limit = 12) => getProductsByIds(all<{ product_id: number }>("SELECT product_id FROM recently_viewed WHERE user_id = ? ORDER BY viewed_at DESC LIMIT ?", userId, limit).map((r) => r.product_id));
