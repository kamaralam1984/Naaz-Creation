import Link from "next/link";
import { all, get } from "@/server/db";
import { requirePerm } from "@/server/auth";
import { Notice } from "@/components/ui/Field";
import { PageHeader, Pager, Panel, StatusBadge, btnCls, btnDanger, btnOutline, tableCls } from "@/components/admin/ui";
import { MarketingConfirmButton } from "@/components/admin/MarketingFields";
import { one, type SP } from "@/server/admin-marketing";
import { dateFmt } from "@/lib/format";
import { moderateReview } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reviews" };
const PER = 20;

export default async function Page({ searchParams }: { searchParams: SP }) {
  await requirePerm("reviews", "/admin/reviews");
  const sp = await searchParams;
  const status = ["pending", "approved", "rejected"].includes(one(sp.status)) ? one(sp.status) : "";
  const page = Math.max(Number(one(sp.page)) || 1, 1);
  const where = status ? "WHERE r.status = ?" : "";
  const args = status ? [status] : [];
  const total = get<{ n: number }>(`SELECT COUNT(*) n FROM reviews r ${where}`, ...args)!.n;
  const rows = all<{ id: number; name: string; rating: number; title: string | null; body: string; status: string; verified: number; created_at: string; pname: string; slug: string }>(
    `SELECT r.*, p.name AS pname, p.slug FROM reviews r JOIN products p ON p.id = r.product_id ${where} ORDER BY (r.status='pending') DESC, r.created_at DESC LIMIT ? OFFSET ?`, ...args, PER, (page - 1) * PER);
  const base = `/admin/reviews${status ? `?status=${status}` : ""}`;
  const counts = Object.fromEntries(all<{ status: string; n: number }>("SELECT status, COUNT(*) n FROM reviews GROUP BY status").map((r) => [r.status, r.n]));
  return (
    <>
      <PageHeader title="Reviews" sub="Approve or reject customer reviews. Ratings on products update automatically." />
      {one(sp.ok) && <div className="mb-4"><Notice tone="success">{one(sp.ok)}</Notice></div>}
      {one(sp.error) && <div className="mb-4"><Notice tone="error">{one(sp.error)}</Notice></div>}
      <nav className="mb-4 flex flex-wrap gap-2 text-sm" aria-label="Filter by status">
        {[["", "All"], ["pending", `Pending (${counts.pending ?? 0})`], ["approved", `Approved (${counts.approved ?? 0})`], ["rejected", `Rejected (${counts.rejected ?? 0})`]].map(([v, l]) => (
          <Link key={v} href={v ? `/admin/reviews?status=${v}` : "/admin/reviews"} className={status === v ? btnCls : btnOutline}>{l}</Link>
        ))}
      </nav>
      <Panel className="overflow-x-auto">
        <table className={tableCls}>
          <thead><tr><th>Product</th><th>Review</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="align-top">
                <td className="min-w-40"><Link href={`/product/${r.slug}`} className="underline">{r.pname}</Link></td>
                <td className="min-w-72"><p className="text-champagne-deep" aria-label={`${r.rating} stars`}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>{r.title && <p className="font-medium">{r.title}</p>}<p className="text-charcoal/80">{r.body}</p><p className="mt-1 text-xs text-charcoal/55">{r.name}{r.verified ? " · verified buyer" : ""}</p></td>
                <td><StatusBadge status={r.status} /></td>
                <td className="whitespace-nowrap text-charcoal/60">{dateFmt(r.created_at)}</td>
                <td>
                  <form action={moderateReview} className="flex flex-wrap gap-2">
                    <input type="hidden" name="id" value={r.id} /><input type="hidden" name="back" value={base} />
                    {r.status !== "approved" && <button name="op" value="approved" className={btnCls}>Approve</button>}
                    {r.status !== "rejected" && <button name="op" value="rejected" className={btnOutline}>Reject</button>}
                    <MarketingConfirmButton name="op" value="delete" message="Delete this review permanently?" className={btnDanger}>Delete</MarketingConfirmButton>
                  </form>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={5} className="text-charcoal/60">No reviews here.</td></tr>}
          </tbody>
        </table>
      </Panel>
      <Pager page={page} pages={Math.max(Math.ceil(total / PER), 1)} base={base} />
    </>
  );
}
