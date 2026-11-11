import { all, get, run, tx } from "./db";
import type { Address } from "./types";

export type FormState = { error?: string; fieldErrors?: Record<string, string>; ok?: boolean; message?: string };

/** Only same-site relative paths are allowed as post-login destinations. */
export function safeNext(next: unknown, fallback: string): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.includes("\\") || next.includes("\n")) return fallback;
  return next;
}

export const userAddresses = (userId: number) => all<Address>("SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC", userId);
export const userAddress = (userId: number, id: number) => get<Address>("SELECT * FROM addresses WHERE id = ? AND user_id = ?", id, userId);

export function saveAddress(userId: number, id: number | null, a: { label?: string | null; name: string; phone: string; line1: string; line2?: string | null; city: string; state: string; pincode: string; country: string }, makeDefault: boolean) {
  return tx(() => {
    const count = get<{ n: number }>("SELECT COUNT(*) AS n FROM addresses WHERE user_id = ?", userId)!.n;
    const def = makeDefault || count === 0;
    if (def) run("UPDATE addresses SET is_default = 0 WHERE user_id = ?", userId);
    if (id) {
      run("UPDATE addresses SET label=?, name=?, phone=?, line1=?, line2=?, city=?, state=?, pincode=?, country=?, is_default = CASE WHEN ? THEN 1 ELSE is_default END WHERE id=? AND user_id=?",
        a.label ?? null, a.name, a.phone, a.line1, a.line2 ?? null, a.city, a.state, a.pincode, a.country, def ? 1 : 0, id, userId);
    } else {
      run("INSERT INTO addresses(user_id,label,name,phone,line1,line2,city,state,pincode,country,is_default) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
        userId, a.label ?? null, a.name, a.phone, a.line1, a.line2 ?? null, a.city, a.state, a.pincode, a.country, def ? 1 : 0);
    }
  });
}
export function deleteAddress(userId: number, id: number) {
  tx(() => {
    const wasDefault = get<{ is_default: number }>("SELECT is_default FROM addresses WHERE id = ? AND user_id = ?", id, userId)?.is_default;
    run("DELETE FROM addresses WHERE id = ? AND user_id = ?", id, userId);
    if (wasDefault) run("UPDATE addresses SET is_default = 1 WHERE id = (SELECT id FROM addresses WHERE user_id = ? ORDER BY id DESC LIMIT 1)", userId);
  });
}
export function setDefaultAddress(userId: number, id: number) {
  tx(() => {
    if (!userAddress(userId, id)) return;
    run("UPDATE addresses SET is_default = 0 WHERE user_id = ?", userId);
    run("UPDATE addresses SET is_default = 1 WHERE id = ? AND user_id = ?", id, userId);
  });
}

export const loyaltyLedger = (userId: number, limit = 8) => all<{ id: number; points: number; reason: string; created_at: string }>("SELECT id, points, reason, created_at FROM loyalty_ledger WHERE user_id = ? ORDER BY id DESC LIMIT ?", userId, limit);

export type ReturnRow = { id: number; status: string; reason: string; details: string | null; refund_amount: number; created_at: string; updated_at: string; order_number: string; payment_status: string; item_name: string | null; qty: number | null };
export const userReturns = (userId: number) => all<ReturnRow>(
  `SELECT r.id, r.status, r.reason, r.details, r.refund_amount, r.created_at, r.updated_at, o.number AS order_number, o.payment_status, i.name AS item_name, i.qty
   FROM returns r JOIN orders o ON o.id = r.order_id LEFT JOIN order_items i ON i.id = r.order_item_id WHERE r.user_id = ? ORDER BY r.id DESC`, userId);
export const orderReturns = (orderId: number) => all<{ order_item_id: number | null; status: string; id: number }>("SELECT id, order_item_id, status FROM returns WHERE order_id = ?", orderId);

export const withinDays = (sqlDate: string, days: number) => Date.now() - new Date(sqlDate.replace(" ", "T") + "Z").getTime() <= days * 864e5;
