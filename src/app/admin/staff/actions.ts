"use server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { get, run, tx } from "@/server/db";
import { logActivity, registerUser, requirePerm } from "@/server/auth";
import { emailSchema, passwordSchema } from "@/server/security";
import { flash, intOr, str } from "@/server/admin-marketing";

export type CreateState = { error?: string; created?: { email: string; password: string } } | null;

export async function createStaff(_prev: CreateState, fd: FormData): Promise<CreateState> {
  const me = await requirePerm("staff", "/admin/staff");
  const p = z.object({ name: z.string().trim().min(2, "Name is required").max(100), email: emailSchema, role: z.enum(["staff", "admin"]) }).safeParse({ name: str(fd, "name"), email: str(fd, "email"), role: str(fd, "role") || "staff" });
  if (!p.success) return { error: p.error.issues[0].message };
  const password = randomBytes(9).toString("base64url") + "7a"; // ≥ 8 chars, letters + digits
  if (!passwordSchema.safeParse(password).success) return { error: "Could not generate a password, try again." };
  const r = await registerUser({ name: p.data.name, email: p.data.email, password, role: p.data.role });
  if ("error" in r) return { error: r.error };
  logActivity(me.id, "staff_created", { email: p.data.email, role: p.data.role });
  return { created: { email: p.data.email, password } };
}

function activeAdmins() { return get<{ n: number }>("SELECT COUNT(*) n FROM users WHERE role = 'admin' AND is_active = 1")!.n; }

export async function setRole(fd: FormData) {
  const me = await requirePerm("staff", "/admin/staff");
  const id = intOr(fd, "id");
  const role = z.enum(["customer", "staff", "admin"]).safeParse(str(fd, "role"));
  if (!role.success) flash("/admin/staff", "error", "Invalid role");
  const u = get<{ id: number; role: string; is_active: number }>("SELECT id, role, is_active FROM users WHERE id = ?", id);
  if (!u) flash("/admin/staff", "error", "User not found");
  if (u.id === me.id) flash("/admin/staff", "error", "You can't change your own role.");
  if (u.role === "admin" && role.data !== "admin" && u.is_active && activeAdmins() <= 1) flash("/admin/staff", "error", "At least one active admin is required.");
  tx(() => { run("UPDATE users SET role = ? WHERE id = ?", role.data, id); run("DELETE FROM sessions WHERE user_id = ?", id); });
  logActivity(me.id, "role_changed", { id, role: role.data });
  flash("/admin/staff", "ok", `Role updated to ${role.data}`);
}

export async function setActive(fd: FormData) {
  const me = await requirePerm("staff", "/admin/staff");
  const id = intOr(fd, "id");
  const active = str(fd, "active") === "1";
  const u = get<{ id: number; role: string; is_active: number }>("SELECT id, role, is_active FROM users WHERE id = ?", id);
  if (!u) flash("/admin/staff", "error", "User not found");
  if (!active) {
    if (u.id === me.id) flash("/admin/staff", "error", "You can't deactivate yourself.");
    if (u.role === "admin" && u.is_active && activeAdmins() <= 1) flash("/admin/staff", "error", "At least one active admin is required.");
  }
  tx(() => { run("UPDATE users SET is_active = ? WHERE id = ?", active ? 1 : 0, id); if (!active) run("DELETE FROM sessions WHERE user_id = ?", id); });
  logActivity(me.id, active ? "user_reactivated" : "user_deactivated", { id });
  flash("/admin/staff", "ok", active ? "User reactivated" : "User deactivated and signed out");
}
