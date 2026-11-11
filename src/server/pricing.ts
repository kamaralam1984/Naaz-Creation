import { get } from "./db";
import { getProductsByIds, getVariants } from "./catalog";
import { num } from "./settings";
import type { CartLine, Tone } from "./types";

export type PricedLine = {
  productId: number; variantId: number | null; slug: string; name: string; variantLabel: string | null; sku: string;
  price: number; qty: number; lineTotal: number; image: string | null; tone: Tone; kind: "physical" | "giftcard";
  stock: number; categorySlug: string | null; meta?: CartLine["meta"]; error?: string;
};
export type Quote = {
  lines: PricedLine[]; ok: boolean; hasPhysical: boolean;
  subtotal: number; discount: number; couponCode: string | null; couponError?: string; freeShipByCoupon: boolean;
  shipping: number; giftWrapFee: number; giftCardUsed: number; giftCardCode: string | null; giftCardError?: string;
  pointsUsed: number; tax: number; total: number; freeShippingRemaining: number; savings: number;
};
export type QuoteOptions = {
  couponCode?: string | null; deliveryMethod?: "standard" | "express"; country?: string | null;
  giftWrap?: boolean; giftCardCode?: string | null; usePoints?: number; userId?: number | null;
};

type CouponRow = { id: number; code: string; type: "percent" | "fixed" | "freeship"; value: number; min_order: number; max_discount: number | null; usage_limit: number | null; used_count: number; starts_at: string | null; expires_at: string | null; is_active: number };

export function validateCoupon(code: string, subtotal: number): { coupon: CouponRow; discount: number; freeShip: boolean } | { error: string } {
  const c = get<CouponRow>("SELECT * FROM coupons WHERE code = ?", code.trim());
  const now = new Date().toISOString();
  if (!c || !c.is_active) return { error: "That code isn't valid." };
  if (c.starts_at && c.starts_at > now) return { error: "That code isn't active yet." };
  if (c.expires_at && c.expires_at < now) return { error: "That code has expired." };
  if (c.usage_limit != null && c.used_count >= c.usage_limit) return { error: "That code has been fully redeemed." };
  if (subtotal < c.min_order) return { error: `Spend ₹${c.min_order.toLocaleString("en-IN")} or more to use this code.` };
  let discount = 0;
  if (c.type === "percent") discount = Math.floor((subtotal * c.value) / 100);
  if (c.type === "fixed") discount = c.value;
  if (c.max_discount != null) discount = Math.min(discount, c.max_discount);
  return { coupon: c, discount: Math.min(discount, subtotal), freeShip: c.type === "freeship" };
}

export function priceCart(cart: CartLine[], o: QuoteOptions = {}): Quote {
  const merged = new Map<string, CartLine>();
  for (const l of cart) {
    const k = `${l.productId}:${l.variantId ?? 0}:${l.meta?.recipientEmail ?? ""}`;
    const ex = merged.get(k);
    if (ex) ex.qty += l.qty; else merged.set(k, { ...l });
  }
  const items = [...merged.values()].filter((l) => l.qty > 0);
  const products = new Map(getProductsByIds([...new Set(items.map((l) => l.productId))]).map((p) => [p.id, p]));
  const lines: PricedLine[] = [];
  for (const l of items) {
    const p = products.get(l.productId);
    if (!p) continue;
    const variants = getVariants(p.id);
    const v = l.variantId ? variants.find((x) => x.id === l.variantId) : undefined;
    let error: string | undefined;
    if (variants.length && !v) error = "Please choose an option.";
    const stock = v ? v.stock : p.stock;
    const qty = Math.min(Math.max(Math.floor(l.qty), 1), 50);
    if (p.kind === "physical" && !error) {
      if (stock <= 0) error = "Out of stock";
      else if (qty > stock) error = `Only ${stock} left`;
    }
    const price = v?.price ?? p.price;
    lines.push({
      productId: p.id, variantId: v?.id ?? null, slug: p.slug, name: p.name, variantLabel: v?.label ?? null, sku: v?.sku ?? p.sku,
      price, qty, lineTotal: price * qty, image: p.images[0] ?? null, tone: p.tone, kind: p.kind, stock, categorySlug: p.category_slug ?? null, meta: l.meta, error,
    });
  }

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const hasPhysical = lines.some((l) => l.kind === "physical");

  let discount = 0, couponCode: string | null = null, couponError: string | undefined, freeShipByCoupon = false;
  if (o.couponCode?.trim()) {
    const r = validateCoupon(o.couponCode, subtotal);
    if ("error" in r) couponError = r.error; else { discount = r.discount; couponCode = r.coupon.code; freeShipByCoupon = r.freeShip; }
  }

  const intl = !!o.country && o.country.trim().toLowerCase() !== "india";
  const afterDiscount = subtotal - discount;
  const threshold = num("free_shipping_threshold");
  let shipping = 0;
  if (hasPhysical) {
    if (intl) shipping = freeShipByCoupon ? 0 : num("shipping_international");
    else if (freeShipByCoupon || afterDiscount >= threshold) shipping = o.deliveryMethod === "express" ? num("shipping_express") - num("shipping_standard") : 0;
    else shipping = o.deliveryMethod === "express" ? num("shipping_express") : num("shipping_standard");
    if (shipping < 0) shipping = 0;
  }
  const giftWrapFee = hasPhysical && o.giftWrap ? num("gift_wrap_fee") : 0;

  const rate = num("tax_rate");
  const inclusive = num("tax_inclusive") === 1;
  const taxable = afterDiscount + shipping + giftWrapFee;
  const tax = inclusive ? Math.round((taxable * rate) / (100 + rate)) : Math.round((taxable * rate) / 100);
  let payable = taxable + (inclusive ? 0 : tax);

  let giftCardUsed = 0, giftCardCode: string | null = null, giftCardError: string | undefined;
  if (o.giftCardCode?.trim()) {
    const g = get<{ code: string; balance: number; status: string; expires_at: string | null }>("SELECT code, balance, status, expires_at FROM gift_cards WHERE code = ?", o.giftCardCode.trim().toUpperCase());
    if (!g || g.status !== "active" || g.balance <= 0 || (g.expires_at && g.expires_at < new Date().toISOString())) giftCardError = "That gift card isn't valid or has no balance.";
    else { giftCardUsed = Math.min(g.balance, payable); giftCardCode = g.code; payable -= giftCardUsed; }
  }

  let pointsUsed = 0;
  if (o.userId && o.usePoints && o.usePoints > 0) {
    const bal = get<{ loyalty_points: number }>("SELECT loyalty_points FROM users WHERE id = ?", o.userId)?.loyalty_points ?? 0;
    const value = Math.max(num("loyalty_point_value"), 1);
    const cap = Math.floor((payable * num("loyalty_max_redeem_pct")) / 100 / value);
    pointsUsed = Math.max(0, Math.min(Math.floor(o.usePoints), bal, cap));
    payable -= pointsUsed * value;
  }

  return {
    lines, ok: lines.length > 0 && lines.every((l) => !l.error), hasPhysical,
    subtotal, discount, couponCode, couponError, freeShipByCoupon, shipping, giftWrapFee,
    giftCardUsed, giftCardCode, giftCardError, pointsUsed, tax, total: Math.max(payable, 0),
    freeShippingRemaining: hasPhysical && !intl ? Math.max(threshold - afterDiscount, 0) : 0,
    savings: lines.reduce((s, l) => s, 0) + discount,
  };
}

/** Rough delivery estimate by PIN. Replace with a courier API (e.g. Shiprocket serviceability) when available. */
export function estimateDelivery(pin: string, express = false) {
  if (!/^[1-9][0-9]{5}$/.test(pin)) return { serviceable: false as const, message: "Enter a valid 6-digit PIN code." };
  const first = Number(pin[0]);
  const base = ({ 1: 4, 2: 5, 3: 5, 4: 4, 5: 4, 6: 6, 7: 7, 8: 7, 9: 9 } as Record<number, number>)[first] ?? num("delivery_days_default");
  const min = Math.max(express ? base - 2 : base, 1), max = min + 2;
  const d = (n: number) => { const x = new Date(Date.now() + n * 864e5); return x.toLocaleDateString("en-IN", { day: "numeric", month: "short" }); };
  return { serviceable: true as const, min, max, message: `Delivery by ${d(min)} – ${d(max)}`, express };
}
