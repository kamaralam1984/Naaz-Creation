"use server";
import { z } from "zod";
import { get, run } from "@/server/db";
import { requirePerm } from "@/server/auth";
import { flag, flash, intOr, str } from "@/server/admin-marketing";

const dt = z.string().refine((v) => !v || !Number.isNaN(Date.parse(v)), "Invalid date");
const schema = z.object({
  code: z.string().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/, "Code: 3–30 letters, numbers, - or _"),
  description: z.string().max(200), type: z.enum(["percent", "fixed", "freeship"]),
  value: z.number().int().min(0).max(1_000_000), min_order: z.number().int().min(0), max_discount: z.number().int().min(0).nullable(),
  usage_limit: z.number().int().min(1).nullable(), starts_at: dt, expires_at: dt,
}).superRefine((d, c) => {
  if (d.type === "percent" && (d.value < 1 || d.value > 100)) c.addIssue({ code: "custom", message: "Percent must be between 1 and 100" });
  if (d.type === "fixed" && d.value < 1) c.addIssue({ code: "custom", message: "Fixed amount must be at least ₹1" });
  if (d.starts_at && d.expires_at && Date.parse(d.expires_at) <= Date.parse(d.starts_at)) c.addIssue({ code: "custom", message: "Expiry must be after the start date" });
});
const opt = (fd: FormData, k: string) => (str(fd, k) === "" ? null : intOr(fd, k));

export async function saveCoupon(fd: FormData) {
  await requirePerm("marketing", "/admin/coupons");
  const id = intOr(fd, "id");
  const back = id ? `/admin/coupons/${id}` : "/admin/coupons/new";
  const type = str(fd, "type");
  const p = schema.safeParse({ code: str(fd, "code"), description: str(fd, "description"), type, value: type === "freeship" ? 0 : intOr(fd, "value"), min_order: intOr(fd, "min_order"), max_discount: opt(fd, "max_discount"), usage_limit: opt(fd, "usage_limit"), starts_at: str(fd, "starts_at"), expires_at: str(fd, "expires_at") });
  if (!p.success) flash(back, "error", p.error.issues[0].message);
  const d = p.data;
  if (get("SELECT 1 FROM coupons WHERE code = ? AND id != ?", d.code, id)) flash(back, "error", "That code already exists.");
  const iso = (v: string) => (v ? new Date(v).toISOString() : null);
  const vals = [d.code, d.description || null, d.type, d.value, d.min_order, d.max_discount, d.usage_limit, iso(d.starts_at), iso(d.expires_at), flag(fd, "is_active") ? 1 : 0] as const;
  let cid = id;
  if (id) run("UPDATE coupons SET code=?, description=?, type=?, value=?, min_order=?, max_discount=?, usage_limit=?, starts_at=?, expires_at=?, is_active=? WHERE id=?", ...vals, id);
  else cid = run("INSERT INTO coupons(code,description,type,value,min_order,max_discount,usage_limit,starts_at,expires_at,is_active) VALUES(?,?,?,?,?,?,?,?,?,?)", ...vals).id;
  flash(`/admin/coupons/${cid}`, "ok", "Coupon saved");
}

export async function toggleCoupon(fd: FormData) {
  await requirePerm("marketing", "/admin/coupons");
  run("UPDATE coupons SET is_active = 1 - is_active WHERE id = ?", intOr(fd, "id"));
  flash("/admin/coupons", "ok", "Coupon updated");
}
export async function deleteCoupon(fd: FormData) {
  await requirePerm("marketing", "/admin/coupons");
  run("DELETE FROM coupons WHERE id = ?", intOr(fd, "id"));
  flash("/admin/coupons", "ok", "Coupon deleted");
}
