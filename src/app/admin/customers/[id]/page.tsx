import Link from "next/link";
import { notFound } from "next/navigation";
import { getUser, requirePerm } from "@/server/auth";
import { all, get } from "@/server/db";
import { first } from "@/server/admin-queries";
import { parseAddress, userOrders } from "@/server/orders";
import type { Address, User } from "@/server/types";
import { PageHeader, Panel, StatusBadge, btnCls, btnDanger, tableCls } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { toggleCustomerActive } from "../actions";
import { dateFmt, inr } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Customer({ params, searchParams }: PageProps<"/admin/customers/[id]">) {
  await requirePerm("customers");
  const [{ id: raw }, sp, me] = [await params, await searchParams, await getUser()];
  const id = Number(raw);
  const u = Number.isInteger(id) ? get<User & { last_login_at: string | null; referred_by: number | null }>("SELECT id,email,name,phone,role,loyalty_points,referral_code,is_active,created_at,last_login_at,referred_by FROM users WHERE id = ?", id) : undefined;
  if (!u) notFound();
  const orders = userOrders(u.id);
  const addresses = all<Address>("SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id", u.id);
  const ledger = all<{ id: number; points: number; reason: string; created_at: string }>("SELECT id, points, reason, created_at FROM loyalty_ledger WHERE user_id = ? ORDER BY id DESC LIMIT 20", u.id);
  const activity = all<{ id: number; action: string; meta: string | null; created_at: string }>("SELECT id, action, meta, created_at FROM activity_log WHERE user_id = ? ORDER BY id DESC LIMIT 25", u.id);
  const spent = orders.filter((o) => ["paid", "partially_refunded", "refunded"].includes(o.payment_status)).reduce((s, o) => s + o.total, 0);
  return (
    <>
      <PageHeader title={u.name} sub={u.email} actions={<Link href="/admin/customers" className="link-underline self-center text-xs uppercase tracking-[0.16em]">← Customers</Link>} />
      {first(sp.notice) && <p role="status" className="mb-4 border border-green-800/30 bg-green-50 px-4 py-3 text-sm text-green-900">{first(sp.notice)}</p>}
      {first(sp.err) && <p role="alert" className="mb-4 border border-burgundy/40 bg-burgundy/5 px-4 py-3 text-sm text-burgundy">{first(sp.err)}</p>}
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <Panel title="Profile">
            <dl className="space-y-2 text-sm">
              {([["Phone", u.phone ?? "—"], ["Role", u.role], ["Joined", dateFmt(u.created_at)], ["Last login", u.last_login_at ? dateFmt(u.last_login_at) : "—"], ["Orders", String(orders.length)], ["Lifetime spend", inr(spent)], ["Loyalty points", String(u.loyalty_points)], ["Referral code", u.referral_code ?? "—"], ["Status", u.is_active ? "Active" : "Deactivated"]] as [string, string][]).map(([k, v]) => <div key={k} className="flex justify-between gap-4"><dt className="text-charcoal/60">{k}</dt><dd className="text-right capitalize">{v}</dd></div>)}
            </dl>
            {me?.id !== u.id && (
              <form action={toggleCustomerActive} className="mt-5"><input type="hidden" name="id" value={u.id} />
                {u.is_active ? <ConfirmButton className={btnDanger} message="Deactivate this account and sign them out?">Deactivate account</ConfirmButton> : <button className={btnCls}>Reactivate account</button>}</form>
            )}
          </Panel>
          <Panel title="Addresses">{addresses.length ? <ul className="space-y-4">{addresses.map((a) => { const x = parseAddress(JSON.stringify(a)); return <li key={a.id} className="text-sm leading-relaxed">{a.is_default ? <span className="mr-2 text-xs uppercase text-champagne-deep">Default</span> : null}<strong>{a.label}</strong><br />{x.name}, {x.line1}{x.line2 ? `, ${x.line2}` : ""}<br />{x.city}, {x.state} {x.pincode}<br />{x.phone}</li>; })}</ul> : <p className="text-sm text-charcoal/55">No saved addresses.</p>}</Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Orders" className="!p-0"><div className="overflow-x-auto"><table className={tableCls}><thead><tr><th>Order</th><th>Date</th><th>Status</th><th>Payment</th><th className="text-right">Total</th></tr></thead>
            <tbody>{orders.map((o) => <tr key={o.id}><td><Link className="link-underline font-medium" href={`/admin/orders/${o.id}`}>{o.number}</Link></td><td>{dateFmt(o.created_at)}</td><td><StatusBadge status={o.status} /></td><td><StatusBadge status={o.payment_status} /></td><td className="text-right">{inr(o.total)}</td></tr>)}
              {!orders.length && <tr><td colSpan={5} className="text-charcoal/55">No orders yet.</td></tr>}</tbody></table></div></Panel>
          <div className="grid gap-6 md:grid-cols-2">
            <Panel title="Loyalty ledger">{ledger.length ? <ul className="divide-y divide-charcoal/10 text-sm">{ledger.map((l) => <li key={l.id} className="flex justify-between gap-3 py-2"><span>{l.reason}<span className="block text-xs text-charcoal/50">{dateFmt(l.created_at)}</span></span><strong className={l.points < 0 ? "text-burgundy" : "text-green-800"}>{l.points > 0 ? "+" : ""}{l.points}</strong></li>)}</ul> : <p className="text-sm text-charcoal/55">No activity.</p>}</Panel>
            <Panel title="Recent activity">{activity.length ? <ul className="divide-y divide-charcoal/10 text-sm">{activity.map((a) => <li key={a.id} className="flex justify-between gap-3 py-2"><span className="capitalize">{a.action.replace(/_/g, " ")}</span><span className="text-xs text-charcoal/50">{dateFmt(a.created_at)}</span></li>)}</ul> : <p className="text-sm text-charcoal/55">No activity.</p>}</Panel>
          </div>
        </div>
      </div>
    </>
  );
}
