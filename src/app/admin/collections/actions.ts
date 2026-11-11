"use server";
import { z } from "zod";
import { all, get, run, tx } from "@/server/db";
import { requirePerm } from "@/server/auth";
import { flash, flag, intOr, slugify, str, TONES } from "@/server/admin-marketing";

const schema = z.object({
  name: z.string().min(2, "Name is required").max(100), slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug: lowercase letters, numbers, hyphens"),
  blurb: z.string().max(200), description: z.string().max(2000), tone: z.enum(TONES), image: z.string().max(300).refine((v) => !v || v.startsWith("/uploads/") || /^https:\/\//.test(v), "Invalid image URL"),
});

export async function saveCollection(fd: FormData) {
  await requirePerm("marketing", "/admin/collections");
  const id = str(fd, "id");
  const back = id ? `/admin/collections/${id}` : "/admin/collections/new";
  const p = schema.safeParse({ name: str(fd, "name"), slug: slugify(str(fd, "slug") || str(fd, "name")), blurb: str(fd, "blurb"), description: str(fd, "description"), tone: str(fd, "tone"), image: str(fd, "image") });
  if (!p.success) flash(back, "error", p.error.issues[0].message);
  const d = p.data;
  const dup = get<{ id: number }>("SELECT id FROM collections WHERE slug = ? AND id != ?", d.slug, Number(id) || 0);
  if (dup) flash(back, "error", "That slug is already used.");
  const productIds = [...new Set(fd.getAll("product_ids").map(Number).filter((n) => Number.isInteger(n) && n > 0))];
  const vals = [d.name, d.slug, d.blurb || null, d.description || null, d.tone, d.image || null, flag(fd, "is_featured") ? 1 : 0, flag(fd, "is_active") ? 1 : 0, intOr(fd, "sort")] as const;
  const newId = tx(() => {
    let cid = Number(id);
    if (cid) run("UPDATE collections SET name=?, slug=?, blurb=?, description=?, tone=?, image=?, is_featured=?, is_active=?, sort=? WHERE id=?", ...vals, cid);
    else cid = run("INSERT INTO collections(name,slug,blurb,description,tone,image,is_featured,is_active,sort) VALUES(?,?,?,?,?,?,?,?,?)", ...vals).id;
    run("DELETE FROM product_collections WHERE collection_id = ?", cid);
    const valid = all<{ id: number }>("SELECT id FROM products").map((r) => r.id);
    for (const pid of productIds) if (valid.includes(pid)) run("INSERT INTO product_collections(product_id, collection_id) VALUES(?,?)", pid, cid);
    return cid;
  });
  flash(`/admin/collections/${newId}`, "ok", "Collection saved");
}

export async function deleteCollection(fd: FormData) {
  await requirePerm("marketing", "/admin/collections");
  run("DELETE FROM collections WHERE id = ?", intOr(fd, "id"));
  flash("/admin/collections", "ok", "Collection deleted");
}
