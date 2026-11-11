import { getUser, can } from "@/server/auth";
import { allOrdersForExport } from "@/server/admin-queries";

export const dynamic = "force-dynamic";
// Neutralise spreadsheet formula injection and quote every cell.
const cell = (v: unknown) => { let s = String(v ?? ""); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };

export async function GET(req: Request) {
  const u = await getUser();
  if (!can(u, "orders")) return new Response("Forbidden", { status: 403 });
  const sp = new URL(req.url).searchParams;
  const rows = allOrdersForExport({ status: sp.get("status") ?? "", pay: sp.get("pay") ?? "", q: sp.get("q") ?? "", from: sp.get("from") ?? "", to: sp.get("to") ?? "" });
  const head = ["Order", "Date", "Email", "Phone", "Status", "Payment status", "Payment method", "Subtotal", "Discount", "Shipping", "Tax (incl.)", "Total", "Coupon", "Tracking", "Carrier"];
  const lines = [head.map(cell).join(",")];
  for (const o of rows) lines.push([o.number, o.created_at, o.email, o.phone, o.status, o.payment_status, o.payment_method, o.subtotal, o.discount, o.shipping, o.tax, o.total, o.coupon_code, o.tracking_number, o.carrier].map(cell).join(","));
  return new Response(lines.join("\r\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" } });
}
