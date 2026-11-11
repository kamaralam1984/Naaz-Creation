import { all, get } from "@/server/db";
import { requirePerm } from "@/server/auth";
import { Notice } from "@/components/ui/Field";
import { PageHeader, Pager, Panel, StatCard, StatusBadge, btnCls, btnDanger, btnOutline, fieldCls, labelCls, tableCls } from "@/components/admin/ui";
import { MarketingConfirmButton } from "@/components/admin/MarketingFields";
import { one, type SP } from "@/server/admin-marketing";
import { dateFmt } from "@/lib/format";
import { sendCampaign, subscriberOp } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Newsletter" };
const PER = 25;

export default async function Page({ searchParams }: { searchParams: SP }) {
  await requirePerm("marketing", "/admin/newsletter");
  const sp = await searchParams;
  const q = one(sp.q).trim().slice(0, 80);
  const page = Math.max(Number(one(sp.page)) || 1, 1);
  const where = q ? "WHERE email LIKE ?" : ""; const a = q ? [`%${q}%`] : [];
  const total = get<{ n: number }>(`SELECT COUNT(*) n FROM newsletter_subscribers ${where}`, ...a)!.n;
  const active = get<{ n: number }>("SELECT COUNT(*) n FROM newsletter_subscribers WHERE subscribed = 1")!.n;
  const subs = all<{ id: number; email: string; source: string | null; subscribed: number; created_at: string }>(`SELECT * FROM newsletter_subscribers ${where} ORDER BY id DESC LIMIT ? OFFSET ?`, ...a, PER, (page - 1) * PER);
  const outbox = all<{ id: number; to_email: string; subject: string; status: string; error: string | null; created_at: string }>("SELECT id, to_email, subject, status, error, created_at FROM email_outbox ORDER BY id DESC LIMIT 15");
  return (
    <>
      <PageHeader title="Newsletter" sub="Subscribers and one-off campaigns." actions={<a href="/api/admin/newsletter-csv" className={btnOutline}>Export CSV</a>} />
      {one(sp.ok) && <div className="mb-4"><Notice tone="success">{one(sp.ok)}</Notice></div>}
      {one(sp.error) && <div className="mb-4"><Notice tone="error">{one(sp.error)}</Notice></div>}
      <div className="mb-6 grid gap-4 sm:grid-cols-3"><StatCard label="Active subscribers" value={active} /><StatCard label="All records" value={get<{ n: number }>("SELECT COUNT(*) n FROM newsletter_subscribers")!.n} /><StatCard label="Delivery" value={process.env.RESEND_API_KEY ? "Live" : "Log only"} hint={process.env.RESEND_API_KEY ? "Sending via Resend" : "Set RESEND_API_KEY to deliver real email"} /></div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Send campaign">
          <form action={sendCampaign} className="space-y-4">
            <div><label className={labelCls} htmlFor="subject">Subject</label><input id="subject" name="subject" required maxLength={150} className={fieldCls} /></div>
            <div><label className={labelCls} htmlFor="body">Message (plain text; blank line = new paragraph)</label><textarea id="body" name="body" rows={8} required className={fieldCls + " h-auto py-2"} /></div>
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="confirm" className="mt-1" /> I confirm sending this to <strong>{active}</strong> active subscriber{active === 1 ? "" : "s"}.</label>
            <button className={btnCls} disabled={!active}>Send campaign</button>
          </form>
        </Panel>
        <Panel title="Recent emails (outbox)" className="overflow-x-auto">
          <table className={tableCls}><thead><tr><th>To</th><th>Subject</th><th>Status</th></tr></thead>
            <tbody>{outbox.map((o) => <tr key={o.id}><td className="text-xs">{o.to_email}</td><td className="max-w-48 truncate" title={o.error ?? o.subject}>{o.subject}</td><td><span className={o.status === "failed" ? "text-burgundy" : o.status === "sent" ? "text-green-800" : "text-charcoal/60"}>{o.status}</span></td></tr>)}{!outbox.length && <tr><td colSpan={3} className="text-charcoal/60">Nothing sent yet.</td></tr>}</tbody></table>
          <p className="mt-3 text-xs text-charcoal/60">“logged” means stored only. Add RESEND_API_KEY to the environment for real delivery.</p>
        </Panel>
      </div>
      <Panel title="Subscribers" className="mt-6 overflow-x-auto" actions={<form role="search" className="flex gap-2"><input name="q" defaultValue={q} placeholder="Search email" aria-label="Search subscribers" className={fieldCls + " w-52"} /><button className={btnCls}>Search</button></form>}>
        <table className={tableCls}><thead><tr><th>Email</th><th>Source</th><th>Joined</th><th>Status</th><th /></tr></thead>
          <tbody>{subs.map((s) => (
            <tr key={s.id}><td>{s.email}</td><td className="text-charcoal/60">{s.source ?? "—"}</td><td className="whitespace-nowrap text-charcoal/60">{dateFmt(s.created_at)}</td><td><StatusBadge status={s.subscribed ? "approved" : "closed"} /></td>
              <td><form action={subscriberOp} className="flex gap-2"><input type="hidden" name="id" value={s.id} />
                <button name="op" value={s.subscribed ? "unsubscribe" : "resubscribe"} className={btnOutline}>{s.subscribed ? "Unsubscribe" : "Resubscribe"}</button>
                <MarketingConfirmButton name="op" value="delete" message="Delete this subscriber record?" className={btnDanger}>Delete</MarketingConfirmButton></form></td></tr>))}
            {!subs.length && <tr><td colSpan={5} className="text-charcoal/60">No subscribers found.</td></tr>}</tbody></table>
        <Pager page={page} pages={Math.max(Math.ceil(total / PER), 1)} base={`/admin/newsletter${q ? `?q=${encodeURIComponent(q)}` : ""}`} />
      </Panel>
    </>
  );
}
