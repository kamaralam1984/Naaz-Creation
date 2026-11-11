import Link from "next/link";
import { all, get } from "@/server/db";
import { requirePerm } from "@/server/auth";
import { PageHeader, Pager, Panel, StatusBadge, btnCls, btnOutline, fieldCls, tableCls } from "@/components/admin/ui";
import { one, type SP } from "@/server/admin-marketing";
import { dateFmt } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Enquiries" };
const PER = 25;

export default async function Page({ searchParams }: { searchParams: SP }) {
  await requirePerm("enquiries", "/admin/enquiries");
  const sp = await searchParams;
  const type = ["corporate", "bulk", "custom", "contact"].includes(one(sp.type)) ? one(sp.type) : "";
  const status = ["new", "contacted", "quoted", "closed"].includes(one(sp.status)) ? one(sp.status) : "";
  const q = one(sp.q).trim().slice(0, 60);
  const page = Math.max(Number(one(sp.page)) || 1, 1);
  const w: string[] = []; const a: (string | number)[] = [];
  if (type) { w.push("type = ?"); a.push(type); }
  if (status) { w.push("status = ?"); a.push(status); }
  if (q) { w.push("(name LIKE ? OR email LIKE ? OR company LIKE ?)"); a.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  const where = w.length ? "WHERE " + w.join(" AND ") : "";
  const total = get<{ n: number }>(`SELECT COUNT(*) n FROM enquiries ${where}`, ...a)!.n;
  const rows = all<{ id: number; type: string; name: string; email: string; company: string | null; quantity: number | null; budget: string | null; status: string; created_at: string }>(
    `SELECT * FROM enquiries ${where} ORDER BY (status='new') DESC, id DESC LIMIT ? OFFSET ?`, ...a, PER, (page - 1) * PER);
  const qs = new URLSearchParams(Object.entries({ type, status, q }).filter(([, v]) => v) as [string, string][]).toString();
  return (
    <>
      <PageHeader title="Enquiries" sub="Corporate, bulk, custom and contact requests." actions={<a href={`/api/admin/enquiries-csv?${qs}`} className={btnOutline}>Export CSV</a>} />
      <form className="mb-4 flex flex-wrap gap-3" role="search">
        <input name="q" defaultValue={q} placeholder="Search name, email, company" aria-label="Search" className={fieldCls + " max-w-xs"} />
        <select name="type" defaultValue={type} className={fieldCls + " max-w-40"} aria-label="Type"><option value="">All types</option>{["corporate", "bulk", "custom", "contact"].map((t) => <option key={t}>{t}</option>)}</select>
        <select name="status" defaultValue={status} className={fieldCls + " max-w-40"} aria-label="Status"><option value="">All statuses</option>{["new", "contacted", "quoted", "closed"].map((t) => <option key={t}>{t}</option>)}</select>
        <button className={btnCls}>Filter</button>
      </form>
      <Panel className="overflow-x-auto">
        <table className={tableCls}>
          <thead><tr><th>Received</th><th>Type</th><th>Contact</th><th>Company</th><th>Qty / budget</th><th>Status</th><th /></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="whitespace-nowrap text-charcoal/60">{dateFmt(r.created_at)}</td><td className="capitalize">{r.type}</td>
                <td><p className="font-medium">{r.name}</p><p className="text-xs text-charcoal/60">{r.email}</p></td><td>{r.company ?? "—"}</td>
                <td className="text-xs">{r.quantity ? `${r.quantity} pcs` : "—"}{r.budget ? ` · ${r.budget}` : ""}</td><td><StatusBadge status={r.status} /></td>
                <td><Link className="underline" href={`/admin/enquiries/${r.id}`}>Open</Link></td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={7} className="text-charcoal/60">No enquiries match.</td></tr>}
          </tbody>
        </table>
      </Panel>
      <Pager page={page} pages={Math.max(Math.ceil(total / PER), 1)} base={`/admin/enquiries${qs ? "?" + qs : ""}`} />
    </>
  );
}
