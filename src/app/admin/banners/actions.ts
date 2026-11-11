"use server";
import { z } from "zod";
import { get, run } from "@/server/db";
import { requirePerm } from "@/server/auth";
import { setSetting } from "@/server/settings";
import { flag, flash, HOME_SECTION_KEYS, intOr, normalizeHomeSections, str } from "@/server/admin-marketing";

const link = z.string().max(300).refine((v) => !v || (v.startsWith("/") && !v.startsWith("//")) || /^https:\/\//.test(v), "Link must start with / or https://");
const img = z.string().max(300).refine((v) => !v || v.startsWith("/uploads/") || /^https:\/\//.test(v), "Invalid image URL");
const schema = z.object({ placement: z.enum(["announcement", "hero", "promo"]), title: z.string().min(2, "Title is required").max(150), subtitle: z.string().max(300), image: img, href: link, cta: z.string().max(40) });

export async function saveBanner(fd: FormData) {
  await requirePerm("marketing", "/admin/banners");
  const id = intOr(fd, "id");
  const back = id ? `/admin/banners/${id}` : "/admin/banners/new";
  const p = schema.safeParse({ placement: str(fd, "placement"), title: str(fd, "title"), subtitle: str(fd, "subtitle"), image: str(fd, "image"), href: str(fd, "href"), cta: str(fd, "cta") });
  if (!p.success) flash(back, "error", p.error.issues[0].message);
  const d = p.data;
  const v = [d.placement, d.title, d.subtitle || null, d.image || null, d.href || null, d.cta || null, flag(fd, "is_active") ? 1 : 0, intOr(fd, "sort")] as const;
  if (id) run("UPDATE banners SET placement=?, title=?, subtitle=?, image=?, href=?, cta=?, is_active=?, sort=? WHERE id=?", ...v, id);
  else flash(`/admin/banners/${run("INSERT INTO banners(placement,title,subtitle,image,href,cta,is_active,sort) VALUES(?,?,?,?,?,?,?,?)", ...v).id}`, "ok", "Banner created");
  flash(back, "ok", "Banner saved");
}
export async function deleteBanner(fd: FormData) {
  await requirePerm("marketing", "/admin/banners");
  run("DELETE FROM banners WHERE id = ?", intOr(fd, "id"));
  flash("/admin/banners", "ok", "Banner deleted");
}
export async function toggleBanner(fd: FormData) {
  await requirePerm("marketing", "/admin/banners");
  run("UPDATE banners SET is_active = 1 - is_active WHERE id = ?", intOr(fd, "id"));
  flash("/admin/banners", "ok", "Banner updated");
}

export async function saveAnnouncement(fd: FormData) {
  await requirePerm("marketing", "/admin/banners");
  const t = str(fd, "announcement");
  if (t.length > 160) flash("/admin/banners", "error", "Keep the announcement under 160 characters.");
  setSetting("announcement", t);
  flash("/admin/banners", "ok", t ? "Announcement updated" : "Announcement bar hidden");
}

export async function sectionOp(fd: FormData) {
  await requirePerm("marketing", "/admin/banners");
  const key = str(fd, "key"), op = str(fd, "op");
  if (!(HOME_SECTION_KEYS as readonly string[]).includes(key)) flash("/admin/banners", "error", "Unknown section");
  const list = normalizeHomeSections(get<{ value: string }>("SELECT value FROM settings WHERE key = 'home_sections'")?.value);
  const i = list.findIndex((s) => s.key === key);
  if (op === "toggle") list[i].enabled = !list[i].enabled;
  else if (op === "up" && i > 0) [list[i - 1], list[i]] = [list[i], list[i - 1]];
  else if (op === "down" && i < list.length - 1) [list[i + 1], list[i]] = [list[i], list[i + 1]];
  setSetting("home_sections", JSON.stringify(list));
  flash("/admin/banners", "ok", "Homepage sections updated");
}
