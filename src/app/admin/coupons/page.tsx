import Link from "next/link";
import { all } from "@/server/db";
import { requirePerm } from "@/server/auth";
import { Notice } from "@/components/ui/Field";
import { PageHeader, Panel, btnCls, btnOutline, tableCls } from "@/components/admin/ui";
import { one, type SP } from "@/server/admin-marketing";
import { dateFmt } from "@/lib/format";
import { toggleCoupon } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Coupons" };
type C = { id: number; code: string; description: string | null; type: string; value: number; min_order: number; usage_limit: number | null; used_count: number; expires_at: string | null; is_active: number };

export default async function Page({ searchParams }: { searchParams: SP }) {
  await requirePerm("marketing", "/admin/coupons");
  const sp = await searchParams;
  const rows = all<C>("SELECT * FROM coupons ORDER BY is_active DESC, id DESC");
  const now = new Date().toISOString();
  const label = (c: C) => (c.type === "percent" ? `${c.value}% off` : c.type === "fixed" ? `₹${c.value} off` : "Free shipping");
  return (
    <>
      <PageHeader title="Coupons" sub="Discount codes shoppers enter at checkout." actions={<Link href="/admin/coupons/new" className={btnCls}>New coupon</Link>} />
      {one(sp.ok) && <div className="mb-4"><Notice tone="success">{one(sp.ok)}</Notice></div>}
      <Panel className="overflow-x-auto">
        <table className={tableCls}>
          <thead><tr><th>Code</th><th>Offer</th><th>Min order</th><th>Used</th><th>Expires</th><th>Status</th><th /></tr></thead>
          <tbody>{rows.map((c) => {
            const expired = !!c.expires_at && c.expires_at < now; const full = c.usage_limit != null && c.used_count >= c.usage_limit;
            return (
              <tr key={c.id}><td><p className="font-mono font-medium">{c.code}</p><p className="text-xs text-charcoal/55">{c.description}</p></td><td>{label(c)}</td><td>₹{c.min_order.toLocaleString("en-IN")}</td>
                <td>{c.used_count}{c.usage_limit != null ? ` / ${c.usage_limit}` : ""}</td><td className="whitespace-nowrap">{c.expires_at ? dateFmt(c.expires_at) : "Never"}</td>
                <td>{!c.is_active ? "Paused" : expired ? "Expired" : full ? "Used up" : "Live"}</td>
                <td className="flex gap-2"><Link className={btnOutline} href={`/admin/coupons/${c.id}`}>Edit</Link><form action={toggleCoupon}><input type="hidden" name="id" value={c.id} /><button className={btnOutline}>{c.is_active ? "Pause" : "Activate"}</button></form></td></tr>
            );
          })}{!rows.length && <tr><td colSpan={7} className="text-charcoal/60">No coupons.</td></tr>}</tbody>
        </table>
      </Panel>
    </>
  );
}
