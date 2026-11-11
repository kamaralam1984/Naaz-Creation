"use server";
import { redirect } from "next/navigation";
import { logActivity, requirePerm } from "@/server/auth";
import { get, run } from "@/server/db";

export async function toggleCustomerActive(fd: FormData) {
  const me = await requirePerm("customers");
  const id = Number(fd.get("id"));
  const u = get<{ id: number; is_active: number; role: string }>("SELECT id, is_active, role FROM users WHERE id = ?", id);
  if (!u) redirect("/admin/customers");
  if (u.id === me.id) redirect(`/admin/customers/${id}?err=${encodeURIComponent("You can't deactivate your own account.")}`);
  const next = u.is_active ? 0 : 1;
  run("UPDATE users SET is_active = ? WHERE id = ?", next, id);
  if (!next) run("DELETE FROM sessions WHERE user_id = ?", id); // sign them out everywhere
  logActivity(me.id, next ? "admin_reactivate_user" : "admin_deactivate_user", { target: id });
  redirect(`/admin/customers/${id}?notice=${encodeURIComponent(next ? "Account reactivated." : "Account deactivated and signed out.")}`);
}
