"use server";
import { z } from "zod";
import { requirePerm } from "@/server/auth";
import { setSetting, SETTING_DEFAULTS, type SettingKey } from "@/server/settings";
import { flash, str } from "@/server/admin-marketing";

type Kind = "text" | "email" | "int" | "pct" | "bool" | "url" | "json" | "phone";
const GROUPS: Record<string, Partial<Record<SettingKey, Kind>>> = {
  website: { site_name: "text", support_email: "email", support_phone: "phone", whatsapp_number: "phone", logo_url: "url" },
  shipping: { free_shipping_threshold: "int", shipping_standard: "int", shipping_express: "int", shipping_international: "int", international_enabled: "bool", delivery_days_default: "int", gift_wrap_fee: "int" },
  tax: { tax_rate: "pct", tax_inclusive: "bool" },
  currency: { currency_rates: "json" },
  loyalty: { loyalty_earn_per_100: "int", loyalty_point_value: "int", loyalty_max_redeem_pct: "pct", referral_reward_points: "int", return_window_days: "int" },
  email: { email_from: "text" },
  social: { instagram: "url", facebook: "url", pinterest: "url", youtube: "url" },
};

function check(kind: Kind, v: string): string | null {
  switch (kind) {
    case "text": return v.length > 200 ? "Too long" : null;
    case "email": return z.string().email().safeParse(v).success ? null : "Enter a valid email";
    case "int": return /^\d{1,9}$/.test(v) ? null : "Enter a whole number (0 or more)";
    case "pct": return /^\d{1,3}(\.\d+)?$/.test(v) && Number(v) <= 100 ? null : "Enter a percentage from 0 to 100";
    case "bool": return v === "0" || v === "1" ? null : "Invalid";
    case "phone": return !v || /^\+?[0-9\s-]{8,16}$/.test(v) ? null : "Enter a valid phone number";
    case "url": return !v || v.startsWith("/uploads/") || /^https:\/\/[^\s]+$/.test(v) ? null : "Use a full https:// link";
    case "json": try { const o = JSON.parse(v); if (!o || typeof o !== "object" || Array.isArray(o) || o.INR !== 1 || Object.values(o).some((x) => typeof x !== "number" || !(x > 0))) return "Rates must be a JSON object of positive numbers with INR set to 1"; return null; } catch { return "Invalid JSON"; }
  }
}

export async function saveSettings(fd: FormData) {
  await requirePerm("settings", "/admin/settings");
  const group = str(fd, "group");
  const spec = GROUPS[group];
  const back = `/admin/settings?tab=${encodeURIComponent(group)}`;
  if (!spec) flash("/admin/settings", "error", "Unknown settings group");
  const out: [string, string][] = [];
  for (const [key, kind] of Object.entries(spec) as [SettingKey, Kind][]) {
    if (!(key in SETTING_DEFAULTS)) continue;
    const raw = kind === "bool" ? (fd.get(key) === "1" || fd.get(key) === "on" ? "1" : "0") : str(fd, key);
    const err = check(kind, raw);
    if (err) flash(back, "error", `${key.replace(/_/g, " ")}: ${err}`);
    out.push([key, kind === "json" ? JSON.stringify(JSON.parse(raw)) : raw]);
  }
  for (const [k, v] of out) setSetting(k, v);
  flash(back, "ok", "Settings saved");
}
