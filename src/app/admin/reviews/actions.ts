"use server";
import { get, run } from "@/server/db";
import { requirePerm } from "@/server/auth";
import { recalcRating } from "@/server/catalog";
import { flash, intOr, str } from "@/server/admin-marketing";

export async function moderateReview(fd: FormData) {
  await requirePerm("reviews", "/admin/reviews");
  const id = intOr(fd, "id");
  const op = str(fd, "op");
  const r = get<{ product_id: number }>("SELECT product_id FROM reviews WHERE id = ?", id);
  const back = str(fd, "back").startsWith("/admin/reviews") ? str(fd, "back") : "/admin/reviews";
  if (!r) flash(back, "error", "Review not found");
  if (op === "delete") run("DELETE FROM reviews WHERE id = ?", id);
  else if (op === "approved" || op === "rejected" || op === "pending") run("UPDATE reviews SET status = ? WHERE id = ?", op, id);
  else flash(back, "error", "Unknown action");
  recalcRating(r.product_id);
  flash(back, "ok", op === "delete" ? "Review deleted" : `Review ${op}`);
}
