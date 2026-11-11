import { redirect } from "next/navigation";

export const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
export const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
export const flag = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "1";
export const intOr = (fd: FormData, k: string, d = 0) => { const n = Number(str(fd, k)); return Number.isFinite(n) && str(fd, k) !== "" ? Math.trunc(n) : d; };

/** Redirect back to a page with a flash message (never call inside try/catch). */
export function flash(path: string, kind: "error" | "ok", msg: string): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}${kind}=${encodeURIComponent(msg)}`);
}

const cell = (v: unknown) => {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // neutralise spreadsheet formula injection
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export function csvResponse(filename: string, header: string[], rows: unknown[][]) {
  const body = [header, ...rows].map((r) => r.map(cell).join(",")).join("\n");
  return new Response("﻿" + body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "no-store" } });
}

export const TONES = ["clay", "brass", "wine", "sand", "ink"] as const;
export type SP = Promise<Record<string, string | string[] | undefined>>;
export const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/* ───────── homepage sections (settings key `home_sections`) ───────── */
export const HOME_SECTION_KEYS = ["categories", "collections", "bestsellers", "new", "offers", "artisans", "crafts", "occasions", "corporate", "testimonials", "gallery", "newsletter"] as const;
export type HomeSection = { key: (typeof HOME_SECTION_KEYS)[number]; enabled: boolean };
export const HOME_SECTION_LABEL: Record<string, string> = { categories: "Shop by category", collections: "Featured collections", bestsellers: "Best sellers", new: "New arrivals", offers: "Exclusive offers", artisans: "Artisan stories", crafts: "Discover Indian crafts", occasions: "Shop by occasion", corporate: "Corporate gifting", testimonials: "Testimonials", gallery: "Instagram gallery", newsletter: "Newsletter" };

/** Parses + repairs the stored list: unknown keys dropped, missing keys appended (enabled). */
export function normalizeHomeSections(raw: string | null | undefined): HomeSection[] {
  let arr: unknown = [];
  try { arr = raw ? JSON.parse(raw) : []; } catch {}
  const seen = new Set<string>(); const out: HomeSection[] = [];
  if (Array.isArray(arr)) for (const x of arr) {
    const k = (x as { key?: string })?.key;
    if (k && (HOME_SECTION_KEYS as readonly string[]).includes(k) && !seen.has(k)) { seen.add(k); out.push({ key: k as HomeSection["key"], enabled: (x as { enabled?: boolean }).enabled !== false }); }
  }
  for (const k of HOME_SECTION_KEYS) if (!seen.has(k)) out.push({ key: k, enabled: true });
  return out;
}
