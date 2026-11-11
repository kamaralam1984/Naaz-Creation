import { all } from "@/server/db";
import { requirePerm } from "@/server/auth";
import { Notice } from "@/components/ui/Field";
import { PageHeader, Panel, StatusBadge, btnOutline, fieldCls, tableCls } from "@/components/admin/ui";
import { MarketingStaffForm } from "@/components/admin/MarketingStaffForm";
import { one, type SP } from "@/server/admin-marketing";
import { dateFmt } from "@/lib/format";
import { setActive, setRole } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Staff & roles" };

export default async function Page({ searchParams }: { searchParams: SP }) {
  const me = await requirePerm("staff", "/admin/staff");
  const sp = await searchParams;
  const users = all<{ id: number; name: string; email: string; role: string; is_active: number; last_login_at: string | null }>("SELECT id, name, email, role, is_active, last_login_at FROM users WHERE role IN ('staff','admin') ORDER BY role, name");
  return (
    <>
      <PageHeader title="Staff & roles" sub="Admins can do everything. Staff can manage products, orders, returns, reviews and enquiries." />
      {one(sp.ok) && <div className="mb-4"><Notice tone="success">{one(sp.ok)}</Notice></div>}
      {one(sp.error) && <div className="mb-4"><Notice tone="error">{one(sp.error)}</Notice></div>}
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Panel title="Team" className="overflow-x-auto">
          <table className={tableCls}><thead><tr><th>Person</th><th>Role</th><th>Last sign-in</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{users.map((u) => (
              <tr key={u.id}><td><p className="font-medium">{u.name}{u.id === me.id && <span className="ml-2 text-xs text-charcoal/55">(you)</span>}</p><p className="text-xs text-charcoal/55">{u.email}</p></td>
                <td><StatusBadge status={u.role === "admin" ? "approved" : "contacted"} /> <span className="ml-1 capitalize">{u.role}</span></td>
                <td className="whitespace-nowrap text-charcoal/60">{u.last_login_at ? dateFmt(u.last_login_at) : "Never"}</td><td>{u.is_active ? "Active" : "Deactivated"}</td>
                <td>{u.id === me.id ? <span className="text-xs text-charcoal/50">—</span> : (
                  <div className="flex flex-wrap gap-2">
                    <form action={setRole} className="flex gap-2"><input type="hidden" name="id" value={u.id} />
                      <select name="role" defaultValue={u.role} aria-label={`Role for ${u.name}`} className={fieldCls + " !h-10 w-28"}><option value="customer">customer</option><option value="staff">staff</option><option value="admin">admin</option></select>
                      <button className={btnOutline}>Set</button></form>
                    <form action={setActive}><input type="hidden" name="id" value={u.id} /><input type="hidden" name="active" value={u.is_active ? "0" : "1"} /><button className={btnOutline}>{u.is_active ? "Deactivate" : "Reactivate"}</button></form>
                  </div>)}</td></tr>
            ))}</tbody></table>
        </Panel>
        <Panel title="Add team member"><MarketingStaffForm /></Panel>
      </div>
    </>
  );
}
