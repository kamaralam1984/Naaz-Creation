import Link from "next/link";
import { requirePerm } from "@/server/auth";
import { adminCustomers, first, intParam } from "@/server/admin-queries";
import { PageHeader, Panel, Pager, btnOutline, fieldCls, tableCls } from "@/components/admin/ui";
import { dateFmt, inr } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminCustomers({ searchParams }: PageProps<"/admin/customers">) {
  await requirePerm("customers");
  const sp = await searchParams;
  const q = first(sp.q).trim(), page = intParam(sp.page);
  const { rows, total, pages } = adminCustomers(q, page);
  return (
    <>
      <PageHeader title="Customers" sub={`${total} account${total === 1 ? "" : "s"}`} />
      <form className="mb-5 flex gap-3" role="search"><input name="q" defaultValue={q} placeholder="Search name, email or phone" aria-label="Search customers" className={fieldCls + " max-w-md"} /><button className={btnOutline}>Search</button></form>
      <Panel className="!p-0"><div className="overflow-x-auto"><table className={tableCls}>
        <thead><tr><th>Customer</th><th>Role</th><th>Joined</th><th>Last login</th><th className="text-right">Orders</th><th className="text-right">Spent</th><th className="text-right">Points</th></tr></thead>
        <tbody>{rows.map((c) => (
          <tr key={c.id} className={c.is_active ? "" : "opacity-55"}>
            <td><Link href={`/admin/customers/${c.id}`} className="link-underline font-medium">{c.name}</Link>{!c.is_active && <span className="ml-2 text-xs text-burgundy">inactive</span>}<div className="text-xs text-charcoal/55">{c.email}</div></td>
            <td className="capitalize">{c.role}</td><td>{dateFmt(c.created_at)}</td><td>{c.last_login_at ? dateFmt(c.last_login_at) : "—"}</td>
            <td className="text-right">{c.orders}</td><td className="text-right">{inr(c.spent)}</td><td className="text-right">{c.loyalty_points}</td>
          </tr>))}
          {!rows.length && <tr><td colSpan={7} className="py-10 text-center text-charcoal/55">No customers found.</td></tr>}</tbody></table></div></Panel>
      <Pager page={page} pages={pages} base={`/admin/customers?${q ? `q=${encodeURIComponent(q)}` : ""}`} />
    </>
  );
}
