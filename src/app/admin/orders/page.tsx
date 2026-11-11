import Link from "next/link";
import { requirePerm } from "@/server/auth";
import { adminOrders, first, intParam } from "@/server/admin-queries";
import { ORDER_STATUSES, ORDER_STATUS_LABEL } from "@/server/types";
import { PageHeader, Panel, Pager, StatusBadge, btnOutline, fieldCls, tableCls } from "@/components/admin/ui";
import { dateFmt, inr } from "@/lib/format";

export const dynamic = "force-dynamic";
const PAY = ["pending", "paid", "failed", "partially_refunded", "refunded"];

export default async function AdminOrders({ searchParams }: PageProps<"/admin/orders">) {
  await requirePerm("orders");
  const sp = await searchParams;
  const f = { status: first(sp.status), pay: first(sp.pay), q: first(sp.q).trim(), from: first(sp.from), to: first(sp.to) };
  const page = intParam(sp.page);
  const { rows, total, pages } = adminOrders(f, page);
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]).toString();
  return (
    <>
      <PageHeader title="Orders" sub={`${total} order${total === 1 ? "" : "s"}`} actions={<a href={`/admin/orders/export?${qs}`} className={btnOutline}>Export CSV</a>} />
      <form className="mb-5 grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto]" role="search">
        <input name="q" defaultValue={f.q} placeholder="Order no., email or phone" aria-label="Search orders" className={fieldCls} />
        <select name="status" defaultValue={f.status} aria-label="Order status" className={fieldCls}><option value="">Any status</option>{ORDER_STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}</select>
        <select name="pay" defaultValue={f.pay} aria-label="Payment status" className={fieldCls}><option value="">Any payment</option>{PAY.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select>
        <input type="date" name="from" defaultValue={f.from} aria-label="From date" className={fieldCls} />
        <input type="date" name="to" defaultValue={f.to} aria-label="To date" className={fieldCls} />
        <button className={btnOutline}>Filter</button>
      </form>
      <Panel className="!p-0">
        <div className="overflow-x-auto">
          <table className={tableCls}>
            <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Status</th><th>Payment</th><th className="text-right">Total</th></tr></thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td><Link className="link-underline font-medium" href={`/admin/orders/${o.id}`}>{o.number}</Link></td>
                  <td className="whitespace-nowrap">{dateFmt(o.created_at)}</td>
                  <td><div>{o.email}</div><div className="text-xs text-charcoal/55">{o.phone}</div></td>
                  <td>{o.item_count}</td><td><StatusBadge status={o.status} /></td><td><StatusBadge status={o.payment_status} /></td>
                  <td className="text-right">{inr(o.total)}</td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={7} className="py-10 text-center text-charcoal/55">No orders match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
      <Pager page={page} pages={pages} base={`/admin/orders?${qs}`} />
    </>
  );
}
