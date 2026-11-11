import { all } from "@/server/db";
import { requirePerm } from "@/server/auth";
import { priceCart } from "@/server/pricing";
import { Notice } from "@/components/ui/Field";
import { PageHeader, Panel, StatCard, btnCls, tableCls } from "@/components/admin/ui";
import { json } from "@/server/db";
import { one, type SP } from "@/server/admin-marketing";
import { inr } from "@/lib/format";
import type { CartLine } from "@/server/types";
import { sendReminders } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Abandoned carts" };
const ago = (s: string) => { const m = Math.round((Date.now() - new Date(s.replace(" ", "T") + "Z").getTime()) / 60000); return m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`; };

export default async function Page({ searchParams }: { searchParams: SP }) {
  await requirePerm("marketing", "/admin/abandoned-carts");
  const sp = await searchParams;
  const guests = all<{ email: string; total: number; updated_at: string; reminder_sent_at: string | null; recovered: number }>("SELECT email, total, updated_at, reminder_sent_at, recovered FROM abandoned_carts ORDER BY updated_at DESC LIMIT 100");
  const members = all<{ name: string; email: string; data: string; updated_at: string; reminder_sent_at: string | null }>("SELECT u.name, u.email, c.data, c.updated_at, c.reminder_sent_at FROM carts c JOIN users u ON u.id = c.user_id WHERE c.updated_at < datetime('now', '-1 hour') ORDER BY c.updated_at DESC LIMIT 100")
    .map((c) => ({ ...c, lines: json<CartLine[]>(c.data, []) })).filter((c) => c.lines.length)
    .map((c) => ({ ...c, total: priceCart(c.lines).total }));
  const open = guests.filter((g) => !g.recovered);
  const value = open.reduce((s, g) => s + g.total, 0) + members.reduce((s, m) => s + m.total, 0);
  return (
    <>
      <PageHeader title="Abandoned carts" sub="Shoppers who left items behind for over an hour." actions={<form action={sendReminders}><button className={btnCls}>Send reminders now</button></form>} />
      {one(sp.ok) && <div className="mb-4"><Notice tone="success">{one(sp.ok)}</Notice></div>}
      <div className="mb-6 grid gap-4 sm:grid-cols-3"><StatCard label="Open guest carts" value={open.length} /><StatCard label="Signed-in carts" value={members.length} /><StatCard label="Potential revenue" value={inr(value)} /></div>
      <Panel title="Guests who entered an email at checkout" className="overflow-x-auto">
        <table className={tableCls}><thead><tr><th>Email</th><th>Cart total</th><th>Last activity</th><th>Reminder</th><th>Recovered</th></tr></thead>
          <tbody>{guests.map((g) => <tr key={g.email}><td>{g.email}</td><td>{inr(g.total)}</td><td>{ago(g.updated_at)}</td><td>{g.reminder_sent_at ? ago(g.reminder_sent_at) : "—"}</td><td>{g.recovered ? "Yes" : "No"}</td></tr>)}{!guests.length && <tr><td colSpan={5} className="text-charcoal/60">None yet.</td></tr>}</tbody></table>
      </Panel>
      <Panel title="Signed-in customers with saved carts" className="mt-6 overflow-x-auto">
        <table className={tableCls}><thead><tr><th>Customer</th><th>Items</th><th>Cart total</th><th>Last activity</th></tr></thead>
          <tbody>{members.map((m) => <tr key={m.email}><td><p className="font-medium">{m.name}</p><p className="text-xs text-charcoal/55">{m.email}</p></td><td>{m.lines.reduce((s, l) => s + l.qty, 0)}</td><td>{inr(m.total)}</td><td>{ago(m.updated_at)}</td></tr>)}{!members.length && <tr><td colSpan={4} className="text-charcoal/60">None.</td></tr>}</tbody></table>
        <p className="mt-3 text-xs text-charcoal/60">Reminder emails currently target guest carts with an email address; the content agent&apos;s cron route can call the same function on a schedule.</p>
      </Panel>
    </>
  );
}
