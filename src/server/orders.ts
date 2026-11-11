import { randomInt } from "node:crypto";
import { all, get, json, run, tx } from "./db";
import { priceCart, type Quote, type QuoteOptions } from "./pricing";
import { emailLayout, sendEmail, siteUrl } from "./email";
import { escapeHtml, token } from "./security";
import { getSetting, num } from "./settings";
import { refundPayment } from "./payments";
import { logActivity } from "./auth";
import { type AddressInput, type CartLine, type OrderEvent, type OrderItemRow, type OrderRow, type OrderStatus } from "./types";

const HOLD_MINUTES = 30;
const rupees = (n: number) => "₹" + n.toLocaleString("en-IN");

/* ───────────────────────── reads ───────────────────────── */
export const getOrder = (id: number) => get<OrderRow>("SELECT * FROM orders WHERE id = ?", id);
export const getOrderByNumber = (number: string) => get<OrderRow>("SELECT * FROM orders WHERE number = ?", number);
export const getOrderItems = (orderId: number) => all<OrderItemRow>("SELECT * FROM order_items WHERE order_id = ?", orderId);
export const getOrderEvents = (orderId: number) => all<OrderEvent>("SELECT * FROM order_events WHERE order_id = ? ORDER BY id", orderId);
export const parseAddress = (s: string) => json<AddressInput>(s, {} as AddressInput);
export const userOrders = (userId: number) => all<OrderRow>("SELECT * FROM orders WHERE user_id = ? AND NOT (status = 'pending' AND payment_status != 'paid' AND stock_released = 1) ORDER BY id DESC", userId);

/** Guests view their order with number + access token; users with ownership. */
export function authorizeOrderView(order: OrderRow, opts: { userId?: number | null; token?: string | null; staff?: boolean }) {
  if (opts.staff) return true;
  if (opts.userId && order.user_id === opts.userId) return true;
  return !!opts.token && opts.token === order.access_token;
}

function event(orderId: number, status: string, note?: string | null) {
  run("INSERT INTO order_events(order_id, status, note) VALUES(?,?,?)", orderId, status, note ?? null);
}

/* ───────────────────────── create ───────────────────────── */
export type CheckoutInput = {
  lines: CartLine[]; email: string; phone: string; shipping: AddressInput; billing: AddressInput;
  deliveryMethod: "standard" | "express"; couponCode?: string | null; giftWrap?: boolean; giftMessage?: string | null;
  giftCardCode?: string | null; usePoints?: number; notes?: string | null; idempotencyKey: string; userId?: number | null;
};

export class CheckoutError extends Error {}

export function createOrder(input: CheckoutInput): { order: OrderRow; quote: Quote; reused: boolean } {
  sweepExpiredOrders();
  const existing = get<OrderRow>("SELECT * FROM orders WHERE idempotency_key = ?", input.idempotencyKey);
  if (existing) return { order: existing, quote: priceCart(input.lines, {}), reused: true };

  return tx(() => {
    const opts: QuoteOptions = { couponCode: input.couponCode, deliveryMethod: input.deliveryMethod, country: input.shipping.country, giftWrap: input.giftWrap, giftCardCode: input.giftCardCode, usePoints: input.usePoints, userId: input.userId };
    const q = priceCart(input.lines, opts);
    if (!q.lines.length) throw new CheckoutError("Your cart is empty.");
    const bad = q.lines.find((l) => l.error);
    if (bad) throw new CheckoutError(`${bad.name}: ${bad.error}`);
    if (input.couponCode && q.couponError) throw new CheckoutError(q.couponError);
    if (input.giftCardCode && q.giftCardError) throw new CheckoutError(q.giftCardError);
    if (!q.hasPhysical && input.deliveryMethod === "express") throw new CheckoutError("Invalid delivery method.");

    let number = "";
    for (let i = 0; i < 8; i++) { number = `KH-${randomInt(100000, 999999)}`; if (!getOrderByNumber(number)) break; }
    const points = Math.floor((q.total / 100) * num("loyalty_earn_per_100"));
    const r = run(
      `INSERT INTO orders(number, user_id, email, phone, subtotal, discount, shipping, tax, gift_wrap_fee, gift_card_used, points_used, points_earned, total,
        coupon_code, gift_card_code, shipping_address, billing_address, delivery_method, gift_wrap, gift_message, notes, idempotency_key, access_token)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      number, input.userId ?? null, input.email, input.phone, q.subtotal, q.discount, q.shipping, q.tax, q.giftWrapFee, q.giftCardUsed, q.pointsUsed, points, q.total,
      q.couponCode, q.giftCardCode, JSON.stringify(input.shipping), JSON.stringify(input.billing), input.deliveryMethod, input.giftWrap ? 1 : 0,
      input.giftMessage?.slice(0, 300) ?? null, input.notes?.slice(0, 500) ?? null, input.idempotencyKey, token(24));
    const orderId = r.id;

    for (const l of q.lines) {
      run("INSERT INTO order_items(order_id, product_id, variant_id, name, variant_label, sku, price, qty, image, tone, kind, meta) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
        orderId, l.productId, l.variantId, l.name, l.variantLabel, l.sku, l.price, l.qty, l.image, l.tone, l.kind, l.meta ? JSON.stringify(l.meta) : null);
      if (l.kind === "physical") {
        const res = l.variantId
          ? run("UPDATE variants SET stock = stock - ? WHERE id = ? AND stock >= ?", l.qty, l.variantId, l.qty)
          : run("UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?", l.qty, l.productId, l.qty);
        if (!res.changes) throw new CheckoutError(`${l.name} just sold out.`);
        if (l.variantId) run("UPDATE products SET stock = (SELECT COALESCE(SUM(stock),0) FROM variants WHERE product_id = ?) WHERE id = ?", l.productId, l.productId);
      }
    }
    if (q.giftCardCode) run("UPDATE gift_cards SET balance = balance - ?, status = CASE WHEN balance - ? <= 0 THEN 'used' ELSE status END WHERE code = ? AND balance >= ?", q.giftCardUsed, q.giftCardUsed, q.giftCardCode, q.giftCardUsed);
    if (q.pointsUsed && input.userId) {
      run("UPDATE users SET loyalty_points = loyalty_points - ? WHERE id = ? AND loyalty_points >= ?", q.pointsUsed, input.userId, q.pointsUsed);
      run("INSERT INTO loyalty_ledger(user_id, points, reason, order_id) VALUES(?,?,?,?)", input.userId, -q.pointsUsed, "Redeemed at checkout", orderId);
    }
    event(orderId, "pending", "Order placed — awaiting payment");
    return { order: getOrder(orderId)!, quote: q, reused: false };
  });
}

export function attachGatewayOrder(orderId: number, gatewayOrderId: string) {
  run("UPDATE orders SET razorpay_order_id = ?, payment_status = 'pending', updated_at = datetime('now') WHERE id = ? AND payment_status != 'paid'", gatewayOrderId, orderId);
}

/* ───────────────────────── stock / holds ───────────────────────── */
function releaseHold(order: OrderRow, reason: string) {
  if (order.stock_released) return;
  for (const it of getOrderItems(order.id)) {
    if (it.kind !== "physical" || !it.product_id) continue;
    if (it.variant_id) run("UPDATE variants SET stock = stock + ? WHERE id = ?", it.qty, it.variant_id);
    else run("UPDATE products SET stock = stock + ? WHERE id = ?", it.qty, it.product_id);
    if (it.variant_id) run("UPDATE products SET stock = (SELECT COALESCE(SUM(stock),0) FROM variants WHERE product_id = ?) WHERE id = ?", it.product_id, it.product_id);
  }
  if (order.gift_card_code && order.gift_card_used) run("UPDATE gift_cards SET balance = balance + ?, status = 'active' WHERE code = ?", order.gift_card_used, order.gift_card_code);
  if (order.points_used && order.user_id) {
    run("UPDATE users SET loyalty_points = loyalty_points + ? WHERE id = ?", order.points_used, order.user_id);
    run("INSERT INTO loyalty_ledger(user_id, points, reason, order_id) VALUES(?,?,?,?)", order.user_id, order.points_used, `Refunded: ${reason}`, order.id);
  }
  run("UPDATE orders SET stock_released = 1 WHERE id = ?", order.id);
}

/** Cancels unpaid orders whose stock hold expired. Cheap; called on checkout and admin loads. */
export function sweepExpiredOrders() {
  const stale = all<OrderRow>("SELECT * FROM orders WHERE status = 'pending' AND payment_status IN ('pending','failed') AND stock_released = 0 AND created_at < datetime('now', ?)", `-${HOLD_MINUTES} minutes`);
  for (const o of stale) tx(() => {
    releaseHold(o, "payment window expired");
    run("UPDATE orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?", o.id);
    event(o.id, "cancelled", "Payment window expired");
  });
}

/* ───────────────────────── payment outcomes (idempotent) ───────────────────────── */
export function markOrderPaid(orderId: number, p: { provider: string; paymentId: string; method?: string | null; raw?: unknown }): { already: boolean; order: OrderRow } {
  const giftCards: { code: string; amount: number; to: string; message?: string }[] = [];
  const result = tx(() => {
    const o = getOrder(orderId);
    if (!o) throw new CheckoutError("Order not found.");
    if (o.payment_status === "paid") return { already: true, order: o };

    // Payment arrived after the hold expired: take the stock back (clamped at 0) and flag it.
    let note = `Payment received via ${p.method ?? p.provider}`;
    if (o.stock_released) {
      for (const it of getOrderItems(o.id)) {
        if (it.kind !== "physical" || !it.product_id) continue;
        if (it.variant_id) run("UPDATE variants SET stock = MAX(stock - ?, 0) WHERE id = ?", it.qty, it.variant_id);
        else run("UPDATE products SET stock = MAX(stock - ?, 0) WHERE id = ?", it.qty, it.product_id);
      }
      note += " (after hold expired — please verify stock)";
    }
    run("INSERT OR IGNORE INTO payments(order_id, provider, provider_order_id, provider_payment_id, amount, status, method, raw) VALUES(?,?,?,?,?,'captured',?,?)",
      o.id, p.provider, o.razorpay_order_id, p.paymentId, o.total, p.method ?? null, p.raw ? JSON.stringify(p.raw).slice(0, 4000) : null);
    run("UPDATE orders SET payment_status='paid', status='confirmed', payment_method=?, razorpay_payment_id=?, stock_released=0, updated_at=datetime('now') WHERE id=?", p.method ?? p.provider, p.paymentId, o.id);
    event(o.id, "confirmed", note);

    const items = getOrderItems(o.id);
    for (const it of items) {
      if (it.product_id) run("UPDATE products SET sold_count = sold_count + ? WHERE id = ?", it.qty, it.product_id);
      if (it.kind === "giftcard") {
        const meta = json<{ recipientEmail?: string; message?: string }>(it.meta, {});
        for (let i = 0; i < it.qty; i++) {
          const code = "KH-" + token(6).replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase().padEnd(8, "X");
          run("INSERT INTO gift_cards(code, amount, balance, purchaser_email, recipient_email, message, order_id, expires_at) VALUES(?,?,?,?,?,?,?,?)", code, it.price, it.price, o.email, meta.recipientEmail ?? o.email, meta.message ?? null, o.id, new Date(Date.now() + 365 * 864e5).toISOString());
          giftCards.push({ code, amount: it.price, to: meta.recipientEmail ?? o.email, message: meta.message });
        }
      }
    }
    if (o.coupon_code) run("UPDATE coupons SET used_count = used_count + 1 WHERE code = ?", o.coupon_code);
    if (o.user_id) {
      if (o.points_earned > 0) {
        run("UPDATE users SET loyalty_points = loyalty_points + ? WHERE id = ?", o.points_earned, o.user_id);
        run("INSERT INTO loyalty_ledger(user_id, points, reason, order_id) VALUES(?,?,?,?)", o.user_id, o.points_earned, "Earned on order " + o.number, o.id);
      }
      const prior = get<{ n: number }>("SELECT COUNT(*) AS n FROM orders WHERE user_id = ? AND payment_status IN ('paid','refunded','partially_refunded') AND id != ?", o.user_id, o.id)!.n;
      const ref = get<{ referred_by: number | null }>("SELECT referred_by FROM users WHERE id = ?", o.user_id);
      if (!prior && ref?.referred_by) {
        const reward = num("referral_reward_points");
        for (const uid of [o.user_id, ref.referred_by]) {
          run("UPDATE users SET loyalty_points = loyalty_points + ? WHERE id = ?", reward, uid);
          run("INSERT INTO loyalty_ledger(user_id, points, reason, order_id) VALUES(?,?,?,?)", uid, reward, "Referral reward", o.id);
        }
      }
      run("DELETE FROM carts WHERE user_id = ?", o.user_id);
    }
    run("UPDATE abandoned_carts SET recovered = 1 WHERE email = ?", o.email);
    return { already: false, order: getOrder(o.id)! };
  });
  if (!result.already) {
    void sendOrderEmail(result.order, "confirmed");
    for (const g of giftCards) void sendGiftCardEmail(g, result.order);
    logActivity(result.order.user_id, "order_paid", { number: result.order.number });
  }
  return result;
}

export function markPaymentFailed(orderId: number, reason: string, paymentId?: string | null) {
  tx(() => {
    const o = getOrder(orderId);
    if (!o || o.payment_status === "paid") return;
    run("UPDATE orders SET payment_status='failed', updated_at=datetime('now') WHERE id=?", orderId);
    if (paymentId) run("INSERT OR IGNORE INTO payments(order_id, provider, provider_order_id, provider_payment_id, amount, status, raw) VALUES(?,?,?,?,?,'failed',?)", orderId, o.razorpay_order_id?.startsWith("mock_") ? "mock" : "razorpay", o.razorpay_order_id, paymentId, o.total, reason.slice(0, 500));
    event(orderId, "pending", `Payment failed: ${reason}`);
  });
}

/* ───────────────────────── fulfilment ───────────────────────── */
const FLOW: OrderStatus[] = ["confirmed", "processing", "shipped", "out_for_delivery", "delivered"];

export function updateOrderStatus(orderId: number, status: OrderStatus, opts: { note?: string; trackingNumber?: string; carrier?: string } = {}): { ok: true; order: OrderRow } | { ok: false; error: string } {
  const o = getOrder(orderId);
  if (!o) return { ok: false, error: "Order not found." };
  if (o.status === status) return { ok: false, error: "Order is already in that status." };
  if (["cancelled", "refunded", "returned"].includes(o.status)) return { ok: false, error: `Order is ${o.status}.` };
  if (status === "refunded") return { ok: false, error: "Use the refund action." };
  if (status === "pending") return { ok: false, error: "Cannot move back to pending." };
  if (status === "cancelled" && ["shipped", "out_for_delivery", "delivered"].includes(o.status)) return { ok: false, error: "Shipped orders can't be cancelled — create a return instead." };
  if (status === "returned" && o.status !== "delivered") return { ok: false, error: "Only delivered orders can be marked returned." };
  if (FLOW.includes(status) && o.payment_status !== "paid") return { ok: false, error: "Order isn't paid yet." };
  if (FLOW.includes(status) && FLOW.indexOf(status) < FLOW.indexOf(o.status)) return { ok: false, error: "Cannot move an order backwards." };

  tx(() => {
    if (status === "cancelled") releaseHold(o, "order cancelled");
    run("UPDATE orders SET status=?, tracking_number=COALESCE(?, tracking_number), carrier=COALESCE(?, carrier), updated_at=datetime('now') WHERE id=?", status, opts.trackingNumber ?? null, opts.carrier ?? null, orderId);
    event(orderId, status, opts.note ?? null);
  });
  const updated = getOrder(orderId)!;
  if (["shipped", "out_for_delivery", "delivered", "cancelled"].includes(status)) void sendOrderEmail(updated, status);
  return { ok: true, order: updated };
}

/** Full or partial refund. Calls Razorpay when live; always records the outcome. */
export async function refundOrder(orderId: number, amount: number, note: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const o = getOrder(orderId);
  if (!o) return { ok: false, error: "Order not found." };
  if (o.payment_status !== "paid" && o.payment_status !== "partially_refunded") return { ok: false, error: "Order has no captured payment." };
  const refunded = get<{ s: number | null }>("SELECT SUM(amount) AS s FROM payments WHERE order_id = ? AND status = 'refunded'", orderId)?.s ?? 0;
  const max = o.total - refunded;
  if (!(amount > 0) || amount > max) return { ok: false, error: `Refund must be between ₹1 and ₹${max}.` };
  try {
    if (o.razorpay_payment_id) await refundPayment(o.razorpay_payment_id, amount);
  } catch (e) { return { ok: false, error: String(e instanceof Error ? e.message : e) }; }
  tx(() => {
    run("INSERT INTO payments(order_id, provider, provider_order_id, provider_payment_id, amount, status, method, raw) VALUES(?,?,?,NULL,?,'refunded',?,?)", orderId, o.razorpay_payment_id?.startsWith("mockpay_") ? "mock" : "razorpay", o.razorpay_order_id, amount, o.payment_method, note.slice(0, 500));
    const full = amount >= max;
    run("UPDATE orders SET payment_status=?, status=CASE WHEN ? THEN 'refunded' ELSE status END, updated_at=datetime('now') WHERE id=?", full ? "refunded" : "partially_refunded", full ? 1 : 0, orderId);
    event(orderId, full ? "refunded" : o.status, `Refund of ${rupees(amount)} issued. ${note}`);
    if (full && ["confirmed", "processing"].includes(o.status)) releaseHold(o, "order refunded");
  });
  void sendEmail(o.email, `Refund issued for ${o.number}`, emailLayout("Your refund is on its way", `<p>We've refunded <strong>${rupees(amount)}</strong> for order ${escapeHtml(o.number)}. It typically reaches your original payment method in 5–7 business days.</p>`));
  return { ok: true };
}

/* ───────────────────────── returns ───────────────────────── */
export function requestReturn(p: { orderId: number; userId: number; itemId: number; reason: string; details?: string }): { ok: true } | { ok: false; error: string } {
  const o = getOrder(p.orderId);
  if (!o || o.user_id !== p.userId) return { ok: false, error: "Order not found." };
  if (o.status !== "delivered") return { ok: false, error: "Returns can be requested once an order is delivered." };
  const deliveredAt = get<{ created_at: string }>("SELECT created_at FROM order_events WHERE order_id = ? AND status = 'delivered' ORDER BY id DESC", o.id)?.created_at ?? o.updated_at;
  if (Date.now() - new Date(deliveredAt.replace(" ", "T") + "Z").getTime() > num("return_window_days") * 864e5) return { ok: false, error: `The ${num("return_window_days")}-day return window has closed.` };
  const item = get<OrderItemRow>("SELECT * FROM order_items WHERE id = ? AND order_id = ?", p.itemId, o.id);
  if (!item) return { ok: false, error: "Item not found." };
  if (item.kind === "giftcard") return { ok: false, error: "Gift cards can't be returned." };
  if (get("SELECT 1 FROM returns WHERE order_item_id = ? AND status != 'rejected'", item.id)) return { ok: false, error: "A return for this item is already in progress." };
  run("INSERT INTO returns(order_id, order_item_id, user_id, reason, details, refund_amount) VALUES(?,?,?,?,?,?)", o.id, item.id, p.userId, p.reason, p.details ?? null, item.price * item.qty);
  event(o.id, o.status, `Return requested for ${item.name}`);
  return { ok: true };
}

export async function setReturnStatus(returnId: number, status: "approved" | "rejected" | "received" | "refunded", refundAmount?: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const r = get<{ id: number; order_id: number; refund_amount: number; status: string }>("SELECT * FROM returns WHERE id = ?", returnId);
  if (!r) return { ok: false, error: "Return not found." };
  if (status === "refunded") {
    const res = await refundOrder(r.order_id, refundAmount ?? r.refund_amount, `Return #${r.id}`);
    if (!res.ok) return res;
    run("UPDATE returns SET status='refunded', refund_amount=?, updated_at=datetime('now') WHERE id=?", refundAmount ?? r.refund_amount, r.id);
    return { ok: true };
  }
  run("UPDATE returns SET status=?, updated_at=datetime('now') WHERE id=?", status, r.id);
  event(r.order_id, "delivered", `Return #${r.id} ${status}`);
  const o = getOrder(r.order_id);
  if (o) void sendEmail(o.email, `Return update for ${o.number}`, emailLayout(`Your return was ${status}`, `<p>Your return request #${r.id} for order ${escapeHtml(o.number)} is now <strong>${status}</strong>.</p>`));
  return { ok: true };
}

/* ───────────────────────── abandoned carts ───────────────────────── */
export function trackAbandonedCart(email: string, lines: CartLine[]) {
  const q = priceCart(lines);
  if (!q.lines.length) return;
  run("INSERT INTO abandoned_carts(email, data, total) VALUES(?,?,?) ON CONFLICT(email) DO UPDATE SET data=excluded.data, total=excluded.total, updated_at=datetime('now'), recovered=0, reminder_sent_at=NULL", email, JSON.stringify(lines), q.total);
}
export async function sendAbandonedCartReminders(olderThanMinutes = 60): Promise<number> {
  const rows = all<{ id: number; email: string; total: number }>("SELECT id, email, total FROM abandoned_carts WHERE recovered = 0 AND reminder_sent_at IS NULL AND updated_at < datetime('now', ?)", `-${olderThanMinutes} minutes`);
  for (const r of rows) {
    await sendEmail(r.email, "You left something beautiful behind", emailLayout("Still thinking it over?", `<p>Your handcrafted pieces (${rupees(r.total)}) are waiting. Stock on handmade items is limited — complete your order whenever you're ready.</p>`, { label: "Return to cart", href: siteUrl() + "/cart" }));
    run("UPDATE abandoned_carts SET reminder_sent_at = datetime('now') WHERE id = ?", r.id);
  }
  const mine = all<{ user_id: number; email: string }>("SELECT c.user_id, u.email FROM carts c JOIN users u ON u.id = c.user_id WHERE c.data != '[]' AND c.reminder_sent_at IS NULL AND c.updated_at < datetime('now', ?)", `-${olderThanMinutes} minutes`);
  for (const r of mine) {
    await sendEmail(r.email, "You left something beautiful behind", emailLayout("Still thinking it over?", `<p>The pieces in your bag are waiting. Stock on handmade items is limited — complete your order whenever you're ready.</p>`, { label: "Return to bag", href: siteUrl() + "/cart" }));
    run("UPDATE carts SET reminder_sent_at = datetime('now') WHERE user_id = ?", r.user_id);
  }
  return rows.length + mine.length;
}

/* ───────────────────────── emails ───────────────────────── */
function itemsTable(items: OrderItemRow[]) {
  return `<table width="100%" cellpadding="6" style="border-collapse:collapse;font-size:14px">${items.map((i) => `<tr><td>${escapeHtml(i.name)}${i.variant_label ? ` <span style="color:#6b645a">(${escapeHtml(i.variant_label)})</span>` : ""} × ${i.qty}</td><td align="right">${rupees(i.price * i.qty)}</td></tr>`).join("")}</table>`;
}
export async function sendOrderEmail(o: OrderRow, kind: string) {
  const first = o.email;
  const link = `${siteUrl()}/order/${o.number}?token=${o.access_token}`;
  const items = getOrderItems(o.id);
  const copy: Record<string, [string, string]> = {
    confirmed: [`Order ${o.number} confirmed`, `<p>Thank you — your order is confirmed and our artisans will begin preparing it.</p>${itemsTable(items)}<p style="text-align:right"><strong>Total ${rupees(o.total)}</strong>${num("tax_inclusive") ? ` <span style="color:#6b645a">(incl. ${rupees(o.tax)} GST)</span>` : ""}</p>`],
    shipped: [`Order ${o.number} has shipped`, `<p>Your order is on its way${o.carrier ? ` with ${escapeHtml(o.carrier)}` : ""}.</p>${o.tracking_number ? `<p>Tracking number: <strong>${escapeHtml(o.tracking_number)}</strong></p>` : ""}`],
    out_for_delivery: [`Order ${o.number} is out for delivery`, `<p>Your parcel will reach you today. Please keep your phone handy.</p>`],
    delivered: [`Order ${o.number} delivered`, `<p>Your order has been delivered. We hope it brings warmth to your home — we'd love to hear what you think.</p>`],
    cancelled: [`Order ${o.number} cancelled`, `<p>Your order has been cancelled. If you were charged, a refund will follow shortly.</p>`],
  };
  const c = copy[kind];
  if (c) await sendEmail(first, c[0], emailLayout(c[0], c[1], { label: "View order", href: link }));
  void getSetting;
}
async function sendGiftCardEmail(g: { code: string; amount: number; to: string; message?: string }, o: OrderRow) {
  await sendEmail(g.to, `You've received a ${getSetting("site_name")} gift card`, emailLayout(`A gift of ${rupees(g.amount)}`, `${g.message ? `<p><em>“${escapeHtml(g.message)}”</em></p>` : ""}<p>Redeem this code at checkout:</p><p style="font-size:22px;letter-spacing:.2em"><strong>${g.code}</strong></p><p>Valid for 12 months.</p>`, { label: "Start shopping", href: siteUrl() + "/shop" }));
  void o;
}
