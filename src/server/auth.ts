import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { get, run, tx } from "./db";
import { sha256, token, clientIp } from "./security";
import { emailLayout, sendEmail, siteUrl } from "./email";
import { getSetting, num } from "./settings";
import type { Role, User } from "./types";

const scrypt = promisify(_scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
export const SESSION_COOKIE = "kh_session";
const SESSION_DAYS = 30;

export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(pw, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}
export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [alg, saltHex, hashHex] = stored.split("$");
  if (alg !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(pw, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

const USER_COLS = "id, email, name, phone, role, loyalty_points, referral_code, is_active, created_at";

export async function createSession(userId: number) {
  const t = token(32);
  const h = await headers();
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
  run("INSERT INTO sessions(id, user_id, expires_at, ip, ua) VALUES(?,?,?,?,?)", sha256(t), userId, expires.toISOString(), clientIp(h), (h.get("user-agent") ?? "").slice(0, 200));
  run("UPDATE users SET last_login_at = datetime('now') WHERE id = ?", userId);
  run("DELETE FROM sessions WHERE expires_at < ?", new Date().toISOString());
  (await cookies()).set(SESSION_COOKIE, t, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires });
}

export async function destroySession() {
  const c = await cookies();
  const t = c.get(SESSION_COOKIE)?.value;
  if (t) run("DELETE FROM sessions WHERE id = ?", sha256(t));
  c.delete(SESSION_COOKIE);
}

/** Current user (memoised per request) or null. */
export const getUser = cache(async (): Promise<User | null> => {
  const t = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!t) return null;
  const u = get<User>(
    `SELECT ${USER_COLS.split(", ").map((c) => "u." + c).join(", ")} FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at > ? AND u.is_active = 1`, sha256(t), new Date().toISOString());
  return u ?? null;
});

export async function requireUser(next = "/account"): Promise<User> {
  const u = await getUser();
  if (!u) redirect(`/login?next=${encodeURIComponent(next)}`);
  return u;
}

export type Perm = "dashboard" | "products" | "orders" | "returns" | "reviews" | "enquiries" | "customers" | "marketing" | "settings" | "staff";
const STAFF_PERMS: Perm[] = ["dashboard", "products", "orders", "returns", "reviews", "enquiries"];
export const can = (u: Pick<User, "role"> | null, p: Perm) => !!u && (u.role === "admin" || (u.role === "staff" && STAFF_PERMS.includes(p)));

/** Server-side authorization for admin pages and actions. Always call it — proxy.ts is only an optimistic check. */
export async function requirePerm(p: Perm, next = "/admin"): Promise<User> {
  const u = await getUser();
  if (!u) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (!can(u, p)) redirect(u.role === "customer" ? "/" : "/admin?denied=1");
  return u;
}

export function logActivity(userId: number | null, action: string, meta?: unknown) {
  try { run("INSERT INTO activity_log(user_id, action, meta) VALUES(?,?,?)", userId, action, meta ? JSON.stringify(meta) : null); } catch {}
}

export async function registerUser(input: { name: string; email: string; phone?: string | null; password: string; referralCode?: string | null; role?: Role }): Promise<{ user: User } | { error: string }> {
  if (get("SELECT 1 FROM users WHERE email = ?", input.email)) return { error: "An account with this email already exists." };
  const hash = await hashPassword(input.password);
  const code = (input.name.replace(/[^A-Za-z]/g, "").slice(0, 4) || "KH").toUpperCase() + randomBytes(2).toString("hex").toUpperCase();
  const referrer = input.referralCode ? get<{ id: number }>("SELECT id FROM users WHERE referral_code = ?", input.referralCode.trim().toUpperCase()) : undefined;
  const id = tx(() => run("INSERT INTO users(email, name, phone, password_hash, role, referral_code, referred_by) VALUES(?,?,?,?,?,?,?)", input.email, input.name, input.phone ?? null, hash, input.role ?? "customer", code, referrer?.id ?? null).id);
  const user = get<User>(`SELECT ${USER_COLS} FROM users WHERE id = ?`, id)!;
  logActivity(id, "register");
  void sendEmail(user.email, `Welcome to ${getSetting("site_name")}`, emailLayout(`Welcome, ${user.name.split(" ")[0]}`, `<p>Your account is ready. Your personal referral code is <strong>${code}</strong> — share it and you both earn ${num("referral_reward_points")} loyalty points on their first order.</p>`, { label: "Start exploring", href: siteUrl() + "/shop" }));
  return { user };
}

export async function login(email: string, password: string): Promise<{ user: User } | { error: string }> {
  const row = get<User & { password_hash: string }>(`SELECT ${USER_COLS}, password_hash FROM users WHERE email = ?`, email);
  // Always run a hash comparison to keep timing uniform for unknown emails.
  const ok = await verifyPassword(password, row?.password_hash ?? "scrypt$00$00");
  if (!row || !ok || !row.is_active) return { error: "Incorrect email or password." };
  const { password_hash: _drop, ...user } = row; void _drop;
  await createSession(user.id);
  logActivity(user.id, "login");
  return { user };
}

export async function startPasswordReset(email: string) {
  const u = get<{ id: number; name: string; email: string }>("SELECT id, name, email FROM users WHERE email = ? AND is_active = 1", email);
  if (!u) return; // do not reveal whether the email exists
  const t = token(32);
  run("INSERT INTO password_resets(token_hash, user_id, expires_at) VALUES(?,?,?)", sha256(t), u.id, new Date(Date.now() + 3600e3).toISOString());
  const link = `${siteUrl()}/reset-password?token=${t}`;
  await sendEmail(u.email, "Reset your password", emailLayout("Reset your password", `<p>Hi ${u.name.split(" ")[0]}, use the button below to choose a new password. The link is valid for one hour. If you didn't ask for this, you can ignore this email.</p>`, { label: "Choose a new password", href: link }));
}

export async function finishPasswordReset(t: string, newPassword: string): Promise<boolean> {
  const r = get<{ user_id: number }>("SELECT user_id FROM password_resets WHERE token_hash = ? AND used = 0 AND expires_at > ?", sha256(t), new Date().toISOString());
  if (!r) return false;
  const hash = await hashPassword(newPassword);
  tx(() => {
    run("UPDATE users SET password_hash = ? WHERE id = ?", hash, r.user_id);
    run("UPDATE password_resets SET used = 1 WHERE token_hash = ?", sha256(t));
    run("DELETE FROM sessions WHERE user_id = ?", r.user_id); // sign out everywhere
  });
  logActivity(r.user_id, "password_reset");
  return true;
}

export async function changePassword(userId: number, current: string, next: string): Promise<boolean> {
  const row = get<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = ?", userId);
  if (!row || !(await verifyPassword(current, row.password_hash))) return false;
  run("UPDATE users SET password_hash = ? WHERE id = ?", await hashPassword(next), userId);
  logActivity(userId, "password_change");
  return true;
}
