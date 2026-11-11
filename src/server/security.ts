import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";

/* ---------- rate limiting (in-memory; fine for a single node/VPS instance) ---------- */
const buckets = new Map<string, { n: number; reset: number }>();
export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { n: 1, reset: now + windowMs });
    if (buckets.size > 5000) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
    return { ok: true, retryAfter: 0 };
  }
  b.n++;
  return { ok: b.n <= limit, retryAfter: Math.ceil((b.reset - now) / 1000) };
}

export function clientIp(h: Headers): string {
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

/** CSRF defence for cookie-authenticated JSON route handlers: require same-origin. */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser / same-origin GET-like fetches
  try {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    return new URL(origin).host === host;
  } catch { return false; }
}

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
export const token = (bytes = 32) => randomBytes(bytes).toString("base64url");
export function safeEqual(a: string, b: string) {
  const A = Buffer.from(a), B = Buffer.from(b);
  return A.length === B.length && timingSafeEqual(A, B);
}

/* ---------- shared validators ---------- */
export const emailSchema = z.string().trim().toLowerCase().email().max(200);
export const phoneSchema = z.string().trim().regex(/^\+?[0-9\s-]{8,15}$/, "Enter a valid phone number");
export const pincodeSchema = z.string().trim().regex(/^[0-9]{4,10}$/, "Enter a valid PIN / postal code");
export const addressSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: phoneSchema,
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  pincode: pincodeSchema,
  country: z.string().trim().min(2).max(60).default("India"),
});
export const passwordSchema = z.string().min(8, "At least 8 characters").max(128).refine((p) => /[A-Za-z]/.test(p) && /[0-9]/.test(p), "Use letters and numbers");

export function flat(err: z.ZodError): string {
  return err.issues.map((i) => i.message).join(" · ");
}
export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
