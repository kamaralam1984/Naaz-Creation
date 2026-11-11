import { all, get, type Param } from "./db";
import { lowStock } from "./catalog";
import type { OrderRow } from "./types";

const PAID = "('paid','partially_refunded','refunded')";
export const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
export const intParam = (v: string | string[] | undefined, fb = 1) => { const n = parseInt(first(v), 10); return Number.isFinite(n) && n > 0 ? n : fb; };
const like = (s: string) => `%${s.replace(/[%_]/g, "")}%`;

/* ───────────── dashboard ───────────── */
export function dashboard() {
  const n = (sql: string, ...p: Param[]) => get<{ n: number | null }>(sql, ...p)?.n ?? 0;
  const gross = n(`SELECT SUM(total) AS n FROM orders WHERE payment_status IN ${PAID}`);
  const refunds = n("SELECT SUM(amount) AS n FROM payments WHERE status = 'refunded'");

  const months: { key: string; label: string; revenue: number; orders: number }[] = [];
  const d = new Date();
  for (let i = 11; i >= 0; i--) {
    const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - i, 1));
    months.push({ key: m.toISOString().slice(0, 7), label: m.toLocaleDateString("en-IN", { month: "short", timeZone: "UTC" }), revenue: 0, orders: 0 });
  }
  for (const r of all<{ m: string; rev: number; n: number }>(`SELECT strftime('%Y-%m', created_at) AS m, SUM(total) AS rev, COUNT(*) AS n FROM orders WHERE payment_status IN ${PAID} AND created_at >= date('now','start of month','-11 months') GROUP BY m`)) {
    const t = months.find((x) => x.key === r.m); if (t) { t.revenue = r.rev; t.orders = r.n; }
  }
  const days: { key: string; label: string; revenue: number; orders: number }[] = [];
  for (let i = 29; i >= 0; i--) { const x = new Date(Date.now() - i * 864e5); days.push({ key: x.toISOString().slice(0, 10), label: String(x.getUTCDate()), revenue: 0, orders: 0 }); }
  for (const r of all<{ d: string; rev: number; n: number }>(`SELECT date(created_at) AS d, SUM(total) AS rev, COUNT(*) AS n FROM orders WHERE payment_status IN ${PAID} AND created_at >= date('now','-29 days') GROUP BY d`)) {
    const t = days.find((x) => x.key === r.d); if (t) { t.revenue = r.rev; t.orders = r.n; }
  }
  return {
    revenue: gross - refunds, gross, refunds,
    orders: n(`SELECT COUNT(*) AS n FROM orders WHERE payment_status IN ${PAID}`),
    customers: n("SELECT COUNT(*) AS n FROM users WHERE role = 'customer'"),
    products: n("SELECT COUNT(*) AS n FROM products WHERE kind = 'physical'"),
    pending: n("SELECT COUNT(*) AS n FROM orders WHERE status IN ('pending','confirmed','processing')"),
    delivered: n("SELECT COUNT(*) AS n FROM orders WHERE status = 'delivered'"),
    lowStock: lowStock(),
    best: all<{ id: number; name: string; slug: string; sold_count: number }>("SELECT id, name, slug, sold_count FROM products WHERE kind = 'physical' AND sold_count > 0 ORDER BY sold_count DESC LIMIT 5"),
    months, days,
    byCategory: all<{ name: string; rev: number }>(`SELECT COALESCE(c.name, 'Other') AS cat_name, SUM(oi.price * oi.qty) AS rev FROM order_items oi JOIN orders o ON o.id = oi.order_id LEFT JOIN products p ON p.id = oi.product_id LEFT JOIN categories c ON c.id = p.category_id WHERE o.payment_status IN ${PAID} GROUP BY cat_name ORDER BY rev DESC`).map((r) => ({ name: (r as unknown as { cat_name: string }).cat_name, rev: r.rev })),
    byMethod: all<{ m: string; n: number; rev: number }>(`SELECT COALESCE(payment_method, 'unknown') AS m, COUNT(*) AS n, SUM(total) AS rev FROM orders WHERE payment_status IN ${PAID} GROUP BY m ORDER BY rev DESC`),
    coupons: all<{ code: string; used_count: number; type: string; value: number }>("SELECT code, used_count, type, value FROM coupons WHERE used_count > 0 ORDER BY used_count DESC LIMIT 5"),
    recent: all<OrderRow>("SELECT * FROM orders WHERE NOT (status = 'pending' AND payment_status != 'paid') ORDER BY id DESC LIMIT 8"),
  };
}

/* ───────────── products ───────────── */
export type AdminProductRow = { id: number; slug: string; name: string; sku: string; kind: string; price: number; stock: number; low_stock_threshold: number; is_featured: number; is_active: number; images: string; tone: string; category_name: string | null; category_slug: string | null; variant_count: number };
export function adminProducts(o: { q?: string; cat?: string; status?: string; page: number; perPage?: number }) {
  const perPage = o.perPage ?? 20;
  const w: string[] = []; const p: Param[] = [];
  if (o.q) { w.push("(p.name LIKE ? OR p.sku LIKE ? OR p.craft LIKE ?)"); p.push(like(o.q), like(o.q), like(o.q)); }
  if (o.cat) { w.push("c.slug = ?"); p.push(o.cat); }
  if (o.status === "active") w.push("p.is_active = 1");
  if (o.status === "inactive") w.push("p.is_active = 0");
  if (o.status === "low") w.push("p.kind = 'physical' AND p.stock > 0 AND p.stock <= p.low_stock_threshold");
  if (o.status === "out") w.push("p.kind = 'physical' AND p.stock <= 0");
  if (o.status === "featured") w.push("p.is_featured = 1");
  const where = w.length ? "WHERE " + w.join(" AND ") : "";
  const from = `FROM products p LEFT JOIN categories c ON c.id = p.category_id ${where}`;
  const total = get<{ n: number }>(`SELECT COUNT(*) AS n ${from}`, ...p)!.n;
  const rows = all<AdminProductRow>(`SELECT p.id, p.slug, p.name, p.sku, p.kind, p.price, p.stock, p.low_stock_threshold, p.is_featured, p.is_active, p.images, p.tone, c.name AS category_name, c.slug AS category_slug, (SELECT COUNT(*) FROM variants v WHERE v.product_id = p.id) AS variant_count ${from} ORDER BY p.id DESC LIMIT ? OFFSET ?`, ...p, perPage, (o.page - 1) * perPage);
  return { rows, total, pages: Math.max(Math.ceil(total / perPage), 1) };
}

/* ───────────── orders ───────────── */
export type OrderFilter = { status?: string; pay?: string; q?: string; from?: string; to?: string };
function orderWhere(f: OrderFilter) {
  const w: string[] = ["1=1"]; const p: Param[] = [];
  if (f.status) { w.push("o.status = ?"); p.push(f.status); }
  if (f.pay) { w.push("o.payment_status = ?"); p.push(f.pay); }
  if (f.q) { w.push("(o.number LIKE ? OR o.email LIKE ? OR o.phone LIKE ?)"); p.push(like(f.q), like(f.q), like(f.q)); }
  if (/^\d{4}-\d{2}-\d{2}$/.test(f.from ?? "")) { w.push("date(o.created_at) >= ?"); p.push(f.from!); }
  if (/^\d{4}-\d{2}-\d{2}$/.test(f.to ?? "")) { w.push("date(o.created_at) <= ?"); p.push(f.to!); }
  return { where: "WHERE " + w.join(" AND "), p };
}
export function adminOrders(f: OrderFilter, page: number, perPage = 20) {
  const { where, p } = orderWhere(f);
  const total = get<{ n: number }>(`SELECT COUNT(*) AS n FROM orders o ${where}`, ...p)!.n;
  const rows = all<OrderRow & { item_count: number }>(`SELECT o.*, (SELECT COALESCE(SUM(qty),0) FROM order_items WHERE order_id = o.id) AS item_count FROM orders o ${where} ORDER BY o.id DESC LIMIT ? OFFSET ?`, ...p, perPage, (page - 1) * perPage);
  return { rows, total, pages: Math.max(Math.ceil(total / perPage), 1) };
}
export function allOrdersForExport(f: OrderFilter) {
  const { where, p } = orderWhere(f);
  return all<OrderRow>(`SELECT o.* FROM orders o ${where} ORDER BY o.id DESC LIMIT 20000`, ...p);
}
export const orderPayments = (orderId: number) => all<{ id: number; provider: string; provider_payment_id: string | null; amount: number; status: string; method: string | null; created_at: string }>("SELECT id, provider, provider_payment_id, amount, status, method, created_at FROM payments WHERE order_id = ? ORDER BY id", orderId);
export const orderWeightGrams = (orderId: number) => get<{ w: number | null }>("SELECT SUM(COALESCE(p.weight_g, 500) * oi.qty) AS w FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ? AND oi.kind = 'physical'", orderId)?.w ?? 0;

/* ───────────── returns ───────────── */
export type AdminReturn = { id: number; order_id: number; status: string; reason: string; details: string | null; refund_amount: number; created_at: string; order_number: string; email: string; item_name: string | null; qty: number | null; total: number; payment_status: string };
export function adminReturns(status: string) {
  return all<AdminReturn>(`SELECT r.id, r.order_id, r.status, r.reason, r.details, r.refund_amount, r.created_at, o.number AS order_number, o.email, o.total, o.payment_status, oi.name AS item_name, oi.qty FROM returns r JOIN orders o ON o.id = r.order_id LEFT JOIN order_items oi ON oi.id = r.order_item_id ${status ? "WHERE r.status = ?" : ""} ORDER BY r.id DESC LIMIT 200`, ...(status ? [status] : []));
}

/* ───────────── customers ───────────── */
export type AdminCustomer = { id: number; name: string; email: string; phone: string | null; role: string; is_active: number; created_at: string; last_login_at: string | null; orders: number; spent: number; loyalty_points: number };
export function adminCustomers(q: string, page: number, perPage = 20) {
  const w = q ? "WHERE (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)" : "";
  const p: Param[] = q ? [like(q), like(q), like(q)] : [];
  const total = get<{ n: number }>(`SELECT COUNT(*) AS n FROM users u ${w}`, ...p)!.n;
  const rows = all<AdminCustomer>(`SELECT u.id, u.name, u.email, u.phone, u.role, u.is_active, u.created_at, u.last_login_at, u.loyalty_points,
    (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id AND o.payment_status IN ${PAID}) AS orders,
    (SELECT COALESCE(SUM(o.total),0) FROM orders o WHERE o.user_id = u.id AND o.payment_status IN ${PAID}) AS spent
    FROM users u ${w} ORDER BY u.id DESC LIMIT ? OFFSET ?`, ...p, perPage, (page - 1) * perPage);
  return { rows, total, pages: Math.max(Math.ceil(total / perPage), 1) };
}
