import Link from "next/link";
import { requirePerm } from "@/server/auth";
import { dashboard } from "@/server/admin-queries";
import { PageHeader, Panel, StatCard, StatusBadge, tableCls } from "@/components/admin/ui";
import { BarChart, ShareBars } from "@/components/admin/charts";
import { dateFmt, inr } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboard({ searchParams }: PageProps<"/admin">) {
  await requirePerm("dashboard");
  const sp = await searchParams;
  const d = dashboard();
  const rev30 = d.days.reduce((s, x) => s + x.revenue, 0), ord30 = d.days.reduce((s, x) => s + x.orders, 0);
  return (
    <>
      <PageHeader title="Dashboard" sub="How the house is doing" />
      {sp.denied && <p role="alert" className="mb-6 border border-burgundy/40 bg-burgundy/5 px-4 py-3 text-sm text-burgundy">You don&apos;t have access to that section.</p>}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total revenue" value={inr(d.revenue)} hint={`${inr(d.gross)} gross · ${inr(d.refunds)} refunded`} />
        <StatCard label="Total orders" value={d.orders} hint="Paid orders" />
        <StatCard label="Customers" value={d.customers} />
        <StatCard label="Products" value={d.products} />
        <StatCard label="Pending orders" value={d.pending} hint="Pending · confirmed · processing" />
        <StatCard label="Delivered" value={d.delivered} />
        <StatCard label="Low stock" value={d.lowStock.length} tone={d.lowStock.length ? "warn" : undefined} hint="At or below threshold" />
        <StatCard label="Last 30 days" value={inr(rev30)} hint={`${ord30} orders`} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <Panel title="Monthly revenue" className="xl:col-span-2"><BarChart data={d.months.map((m) => ({ label: m.label, value: m.revenue }))} title="Revenue per month, last 12 months" /></Panel>
        <Panel title="Best sellers">
          {d.best.length ? <ol className="space-y-3 text-sm">{d.best.map((p, i) => <li key={p.id} className="flex items-center justify-between gap-3"><span><span className="mr-2 text-charcoal/40">{i + 1}.</span><Link className="link-underline" href={`/admin/products/${p.id}`}>{p.name}</Link></span><span className="text-charcoal/60">{p.sold_count} sold</span></li>)}</ol> : <p className="text-sm text-charcoal/55">No sales yet.</p>}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Daily revenue — last 30 days" className="xl:col-span-2"><BarChart data={d.days.map((x) => ({ label: x.label, value: x.revenue }))} title="Revenue per day, last 30 days" showValues={false} height={180} /></Panel>
        <Panel title="Payment methods"><ShareBars rows={d.byMethod.map((m) => ({ label: m.m, value: m.rev, note: `${m.n} orders` }))} /></Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Revenue by category" className="xl:col-span-2"><ShareBars rows={d.byCategory.map((c) => ({ label: c.name, value: c.rev }))} /></Panel>
        <Panel title="Coupon usage">
          {d.coupons.length ? <ul className="space-y-2 text-sm">{d.coupons.map((c) => <li key={c.code} className="flex justify-between"><code>{c.code}</code><span className="text-charcoal/60">{c.used_count} uses</span></li>)}</ul> : <p className="text-sm text-charcoal/55">No coupons redeemed yet.</p>}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Recent orders" className="xl:col-span-2" actions={<Link href="/admin/orders" className="link-underline text-xs uppercase tracking-[0.16em]">All orders</Link>}>
          <div className="overflow-x-auto"><table className={tableCls}><thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Status</th><th className="text-right">Total</th></tr></thead>
            <tbody>{d.recent.map((o) => <tr key={o.id}><td><Link className="link-underline font-medium" href={`/admin/orders/${o.id}`}>{o.number}</Link></td><td>{dateFmt(o.created_at)}</td><td>{o.email}</td><td><StatusBadge status={o.status} /></td><td className="text-right">{inr(o.total)}</td></tr>)}
              {!d.recent.length && <tr><td colSpan={5} className="text-charcoal/55">No orders yet.</td></tr>}</tbody></table></div>
        </Panel>
        <Panel title="Low stock">
          {d.lowStock.length ? <ul className="divide-y divide-charcoal/10 text-sm">{d.lowStock.slice(0, 8).map((p) => <li key={p.id} className="flex items-center justify-between py-2"><Link className="link-underline" href={`/admin/products/${p.id}`}>{p.name}</Link><span className={p.stock <= 0 ? "text-burgundy" : "text-charcoal/70"}>{p.stock <= 0 ? "Out" : `${p.stock} left`}</span></li>)}</ul> : <p className="text-sm text-charcoal/55">All stocked up.</p>}
        </Panel>
      </div>
    </>
  );
}
