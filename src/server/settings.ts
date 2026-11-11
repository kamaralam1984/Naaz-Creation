import { all, get, run } from "./db";

export const SETTING_DEFAULTS = {
  site_name: "Nazi Creation",
  support_email: "care@nazicreation.com",
  support_phone: "+91 90000 00000",
  whatsapp_number: "919000000000",
  announcement: "Free shipping across India above ₹3,000",
  currency: "INR",
  currency_rates: JSON.stringify({ INR: 1, USD: 0.012, EUR: 0.011, GBP: 0.0095, AED: 0.044 }),
  free_shipping_threshold: "3000",
  shipping_standard: "150",
  shipping_express: "350",
  shipping_international: "2500",
  international_enabled: "1",
  tax_rate: "12",                 // % GST, prices are tax-inclusive
  tax_inclusive: "1",
  gift_wrap_fee: "150",
  loyalty_earn_per_100: "1",      // points per ₹100
  loyalty_point_value: "1",       // ₹ per point on redemption
  loyalty_max_redeem_pct: "20",
  referral_reward_points: "250",
  return_window_days: "7",
  instagram: "https://instagram.com/nazicreation",
  facebook: "https://facebook.com/nazicreation",
  pinterest: "https://pinterest.com/nazicreation",
  youtube: "",
  logo_url: "",
  payment_cod: "0",
  email_from: "Nazi Creation <orders@nazicreation.com>",
  // Shipping zones: first digit of Indian PIN → estimated days (standard)
  delivery_days_default: "6",
} as const;
export type SettingKey = keyof typeof SETTING_DEFAULTS;

export function getSettings(): Record<SettingKey, string> {
  const out: Record<string, string> = { ...SETTING_DEFAULTS };
  for (const r of all<{ key: string; value: string }>("SELECT key, value FROM settings")) out[r.key] = r.value;
  return out as Record<SettingKey, string>;
}
export function getSetting(key: SettingKey): string {
  return get<{ value: string }>("SELECT value FROM settings WHERE key = ?", key)?.value ?? SETTING_DEFAULTS[key];
}
export const num = (key: SettingKey) => Number(getSetting(key)) || 0;
export function setSetting(key: string, value: string) {
  run("INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", key, value);
}
