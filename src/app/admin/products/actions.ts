"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePerm } from "@/server/auth";
import { all, get, run, tx } from "@/server/db";

export type FormState = { error?: string };

const optInt = z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().min(0).max(100_000_000).nullable());
const TONES = ["clay", "brass", "wine", "sand", "ink"] as const;
const mediaUrl = z.string().trim().max(500).refine((u) => u === "" || /^\/uploads\/[\w./-]+$/.test(u) || /^https:\/\/[^\s]+$/.test(u), "Use an uploaded file or an https:// URL");

const schema = z.object({
  id: z.coerce.number().int().min(0),
  name: z.string().trim().min(2, "Name is required").max(160),
  slug: z.string().trim().toLowerCase().min(2, "Slug is required").max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug: lowercase letters, numbers and hyphens only"),
  description: z.string().trim().max(8000),
  category_id: optInt, artisan_id: optInt,
  craft: z.string().trim().max(100), material: z.string().trim().max(100), colors: z.string().max(400),
  dimensions: z.string().trim().max(200), weight_g: optInt, care: z.string().trim().max(1500),
  sku: z.string().trim().min(2, "SKU is required").max(60).regex(/^[\w.-]+$/, "SKU: letters, numbers, - _ . only"),
  price: z.coerce.number().int("Price must be a whole number").min(1, "Price must be at least ₹1").max(10_000_000),
  compare_at: optInt, stock: z.coerce.number().int().min(0).max(1_000_000), low_stock_threshold: z.coerce.number().int().min(0).max(10_000),
  badge: z.enum(["", "New", "Best Seller", "Sale", "Limited"]),
  tone: z.enum(TONES), alt_tone: z.enum(TONES),
  video_url: mediaUrl, seo_title: z.string().trim().max(120), seo_description: z.string().trim().max(300),
  images: z.array(mediaUrl.min(1)).max(10),
  specs: z.array(z.object({ label: z.string().trim().max(60), value: z.string().trim().max(200) })).max(20),
  variants: z.array(z.object({
    id: z.number().int().nullable().optional(), label: z.string().trim().min(1, "Every variant needs a label").max(80), sku: z.string().trim().max(60).optional().nullable(),
    price: z.number().int().min(1).max(10_000_000).nullable(), stock: z.number().int().min(0).max(1_000_000),
  })).max(30),
  collections: z.array(z.coerce.number().int().positive()).max(50),
});

const jsonField = (fd: FormData, k: string) => { try { return JSON.parse(String(fd.get(k) ?? "[]")); } catch { return null; } };

export async function saveProduct(_prev: FormState, fd: FormData): Promise<FormState> {
  await requirePerm("products");
  const parsed = schema.safeParse({
    id: fd.get("id") ?? 0, name: fd.get("name"), slug: fd.get("slug"), description: fd.get("description") ?? "",
    category_id: fd.get("category_id"), artisan_id: fd.get("artisan_id"),
    craft: fd.get("craft") ?? "", material: fd.get("material") ?? "", colors: fd.get("colors") ?? "", dimensions: fd.get("dimensions") ?? "",
    weight_g: fd.get("weight_g"), care: fd.get("care") ?? "", sku: fd.get("sku"), price: fd.get("price"), compare_at: fd.get("compare_at"),
    stock: fd.get("stock") ?? 0, low_stock_threshold: fd.get("low_stock_threshold") ?? 5, badge: fd.get("badge") ?? "",
    tone: fd.get("tone"), alt_tone: fd.get("alt_tone"), video_url: fd.get("video_url") ?? "", seo_title: fd.get("seo_title") ?? "", seo_description: fd.get("seo_description") ?? "",
    images: jsonField(fd, "images"), specs: jsonField(fd, "specs"), variants: jsonField(fd, "variants"), collections: fd.getAll("collections"),
  });
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(" · ") };
  const v = parsed.data;
  const featured = fd.get("is_featured") === "on" ? 1 : 0, active = fd.get("is_active") === "on" ? 1 : 0;

  const existing = v.id ? get<{ id: number; kind: string }>("SELECT id, kind FROM products WHERE id = ?", v.id) : undefined;
  if (v.id && !existing) return { error: "Product not found." };
  if (get("SELECT 1 FROM products WHERE slug = ? AND id != ?", v.slug, v.id)) return { error: "That slug is already used by another product." };
  if (get("SELECT 1 FROM products WHERE sku = ? AND id != ?", v.sku, v.id)) return { error: "That SKU is already used by another product." };
  if (v.compare_at != null && v.compare_at <= v.price) return { error: "Original price must be higher than the sale price (or leave it empty)." };
  if (v.category_id && !get("SELECT 1 FROM categories WHERE id = ?", v.category_id)) return { error: "Unknown category." };

  const vars = v.variants.map((x, i) => ({ ...x, sku: x.sku?.trim() || null, sort: i }));
  const labels = new Set<string>();
  for (const x of vars) { const k = x.label.toLowerCase(); if (labels.has(k)) return { error: `Duplicate variant "${x.label}".` }; labels.add(k); }
  for (const x of vars) {
    if (x.sku && get("SELECT 1 FROM variants WHERE sku = ? AND id != ?", x.sku, x.id ?? 0)) return { error: `Variant SKU ${x.sku} is already in use.` };
  }
  if (new Set(vars.filter((x) => x.sku).map((x) => x.sku)).size !== vars.filter((x) => x.sku).length) return { error: "Variant SKUs must be unique." };
  const stock = vars.length ? vars.reduce((s, x) => s + x.stock, 0) : v.stock;
  const colors = JSON.stringify([...new Set(v.colors.split(",").map((c) => c.trim()).filter(Boolean))].slice(0, 12));
  const specs = JSON.stringify(v.specs.filter((s) => s.label && s.value));

  let id = v.id;
  try {
    tx(() => {
      if (!id) {
        id = run(`INSERT INTO products(slug,name,description,craft,material,colors,dimensions,weight_g,care,specs,category_id,artisan_id,sku,price,compare_at,stock,low_stock_threshold,images,video_url,badge,tone,alt_tone,is_featured,is_active,seo_title,seo_description)
          VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          v.slug, v.name, v.description, v.craft || null, v.material || null, colors, v.dimensions || null, v.weight_g, v.care || null, specs, v.category_id || null, v.artisan_id || null, v.sku, v.price, v.compare_at, stock, v.low_stock_threshold,
          JSON.stringify(v.images), v.video_url || null, v.badge || null, v.tone, v.alt_tone, featured, active, v.seo_title || null, v.seo_description || null).id;
      } else {
        run(`UPDATE products SET slug=?,name=?,description=?,craft=?,material=?,colors=?,dimensions=?,weight_g=?,care=?,specs=?,category_id=?,artisan_id=?,sku=?,price=?,compare_at=?,stock=?,low_stock_threshold=?,images=?,video_url=?,badge=?,tone=?,alt_tone=?,is_featured=?,is_active=?,seo_title=?,seo_description=?,updated_at=datetime('now') WHERE id=?`,
          v.slug, v.name, v.description, v.craft || null, v.material || null, colors, v.dimensions || null, v.weight_g, v.care || null, specs, v.category_id || null, v.artisan_id || null, v.sku, v.price, v.compare_at, stock, v.low_stock_threshold,
          JSON.stringify(v.images), v.video_url || null, v.badge || null, v.tone, v.alt_tone, featured, active, v.seo_title || null, v.seo_description || null, id);
      }
      // variants: update known ids, insert new, delete removed
      const keep = new Set<number>();
      for (const x of vars) {
        const own = x.id ? get("SELECT 1 FROM variants WHERE id = ? AND product_id = ?", x.id, id) : undefined;
        if (own && x.id) { run("UPDATE variants SET label=?, sku=?, price=?, stock=?, sort=? WHERE id=?", x.label, x.sku, x.price, x.stock, x.sort, x.id); keep.add(x.id); }
        else keep.add(run("INSERT INTO variants(product_id,label,sku,price,stock,sort) VALUES(?,?,?,?,?,?)", id, x.label, x.sku, x.price, x.stock, x.sort).id);
      }
      for (const r of all<{ id: number }>("SELECT id FROM variants WHERE product_id = ?", id)) if (!keep.has(r.id)) run("DELETE FROM variants WHERE id = ?", r.id);
      run("DELETE FROM product_collections WHERE product_id = ?", id);
      for (const c of new Set(v.collections)) if (get("SELECT 1 FROM collections WHERE id = ?", c)) run("INSERT INTO product_collections(product_id, collection_id) VALUES(?,?)", id, c);
    });
  } catch (e) { return { error: "Could not save: " + String(e instanceof Error ? e.message : e).slice(0, 160) }; }
  redirect(`/admin/products?notice=${encodeURIComponent(v.id ? "Product updated." : "Product created.")}`);
}

export async function deleteProduct(fd: FormData) {
  await requirePerm("products");
  const id = Number(fd.get("id"));
  const p = get<{ id: number; kind: string }>("SELECT id, kind FROM products WHERE id = ?", id);
  if (!p) redirect("/admin/products?err=" + encodeURIComponent("Product not found."));
  if (p.kind === "giftcard") redirect("/admin/products?err=" + encodeURIComponent("The gift card product can't be deleted — hide it instead."));
  if (get("SELECT 1 FROM order_items WHERE product_id = ?", id)) {
    run("UPDATE products SET is_active = 0, is_featured = 0, updated_at = datetime('now') WHERE id = ?", id);
    redirect("/admin/products?notice=" + encodeURIComponent("This product has past orders, so it was hidden (deactivated) instead of deleted."));
  }
  run("DELETE FROM products WHERE id = ?", id);
  redirect("/admin/products?notice=" + encodeURIComponent("Product deleted."));
}

export async function toggleProductFlag(fd: FormData) {
  await requirePerm("products");
  const id = Number(fd.get("id")), field = String(fd.get("field"));
  if (field === "featured") run("UPDATE products SET is_featured = 1 - is_featured, updated_at = datetime('now') WHERE id = ?", id);
  if (field === "active") run("UPDATE products SET is_active = 1 - is_active, updated_at = datetime('now') WHERE id = ?", id);
  redirect(String(fd.get("back") ?? "/admin/products").startsWith("/admin/products") ? String(fd.get("back")) : "/admin/products");
}
