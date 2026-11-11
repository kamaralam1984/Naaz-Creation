"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, finishPasswordReset, login, registerUser, startPasswordReset } from "@/server/auth";
import { clientIp, emailSchema, flat, passwordSchema, phoneSchema, rateLimit } from "@/server/security";
import { safeNext, type FormState } from "@/server/account";

const field = (fd: FormData, k: string) => (typeof fd.get(k) === "string" ? (fd.get(k) as string) : "");
const fieldErrors = (e: z.ZodError) => Object.fromEntries(e.issues.map((i) => [String(i.path[0]), i.message]));

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const email = emailSchema.safeParse(field(fd, "email"));
  const password = field(fd, "password");
  const keep = { email: field(fd, "email") };
  if (!email.success || !password) return { error: "Enter your email and password.", values: keep };
  const ip = clientIp(await headers());
  if (!rateLimit(`login:${ip}:${email.data}`, 5, 60_000).ok) return { error: "Too many attempts. Please wait a minute and try again.", values: keep };
  const r = await login(email.data, password);
  if ("error" in r) return { error: r.error, values: keep };
  redirect(safeNext(field(fd, "next") || undefined, r.user.role === "customer" ? "/account" : "/admin"));
}

const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(100),
  email: emailSchema,
  phone: z.union([phoneSchema, z.literal("")]),
  password: passwordSchema,
  referral: z.string().trim().max(20),
});

export async function registerAction(_: FormState, fd: FormData): Promise<FormState> {
  const p = registerSchema.safeParse({ name: field(fd, "name"), email: field(fd, "email"), phone: field(fd, "phone"), password: field(fd, "password"), referral: field(fd, "referral") });
  const keep = { name: field(fd, "name"), email: field(fd, "email"), phone: field(fd, "phone"), referral: field(fd, "referral") };
  if (!p.success) return { fieldErrors: fieldErrors(p.error), error: flat(p.error), values: keep };
  const ip = clientIp(await headers());
  if (!rateLimit(`register:${ip}`, 5, 600_000).ok) return { error: "Too many sign-ups from this network. Try again in a few minutes.", values: keep };
  const r = await registerUser({ name: p.data.name, email: p.data.email, phone: p.data.phone || null, password: p.data.password, referralCode: p.data.referral || null });
  if ("error" in r) return { error: r.error, fieldErrors: { email: r.error }, values: keep };
  await createSession(r.user.id);
  redirect(safeNext(field(fd, "next") || undefined, "/account"));
}

export async function forgotAction(_: FormState, fd: FormData): Promise<FormState> {
  const email = emailSchema.safeParse(field(fd, "email"));
  if (!email.success) return { error: "Enter a valid email address.", fieldErrors: { email: "Enter a valid email address." } };
  const ip = clientIp(await headers());
  if (!rateLimit(`forgot:${ip}`, 5, 600_000).ok) return { error: "Too many requests. Please try again later." };
  await startPasswordReset(email.data);
  return { ok: true, message: "If an account exists for that email, a reset link is on its way. It is valid for one hour." };
}

export async function resetAction(_: FormState, fd: FormData): Promise<FormState> {
  const pw = passwordSchema.safeParse(field(fd, "password"));
  if (!pw.success) return { error: flat(pw.error), fieldErrors: { password: flat(pw.error) } };
  if (pw.data !== field(fd, "confirm")) return { error: "Passwords don't match.", fieldErrors: { confirm: "Passwords don't match." } };
  const ip = clientIp(await headers());
  if (!rateLimit(`reset:${ip}`, 10, 600_000).ok) return { error: "Too many attempts. Please try again later." };
  const ok = await finishPasswordReset(field(fd, "token"), pw.data);
  if (!ok) return { error: "This reset link is invalid or has expired. Request a new one." };
  return { ok: true, message: "Your password has been updated. You can now sign in." };
}
