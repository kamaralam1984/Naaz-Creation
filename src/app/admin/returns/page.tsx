import Link from "next/link";
import { requirePerm } from "@/server/auth";
import { adminReturns, first } from "@/server/admin-queries";
import { PageHeader, Panel, StatusBadge, btnCls, btnDanger, btnOutline, fieldCls } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { returnAction } from "./actions";
import { cn } from "@/lib/cn";
import { dateFmt, inr } from "@/lib/format";

export const dynamic = "force-dynamic";
const TABS = ["", "requested", "approved", "received", "refunded", "rejected"];

export default async function AdminReturns({ searchParams }: PageProps<"/admin/returns">) {
  await requirePerm("returns");
  const sp = await searchParams;
  const status = TABS.includes(first(sp.status)) ? first(sp.status) : "";
  const rows = adminReturns(status);
  return (
    <>
      <PageHeader title="Returns & refunds" sub="Review customer return requests and issue refunds" />
      {first(sp.notice) && <p role="status" className="mb-4 border border-green-800/30 bg-green-50 px-4 py-3 text-sm text-green-900">{first(sp.notice)}</p>}
      {first(sp.err) && <p role="alert" className="mb-4 border border-burgundy/40 bg-burgundy/5 px-4 py-3 text-sm text-burgundy">{first(sp.err)}</p>}
      <nav className="mb-5 flex flex-wrap gap-2" aria-label="Filter by status">
        {TABS.map((t) => <Link key={t} href={t ? `/admin/returns?status=${t}` : "/admin/returns"} className={cn("border px-3 py-1.5 text-xs uppercase tracking-[0.14em]", status === t ? "border-charcoal bg-charcoal text-ivory" : "border-charcoal/30 hover:border-charcoal")}>{t || "All"}</Link>)}
      </nav>
      <div className="space-y-4">
        {rows.map((r) => (
          <Panel key={r.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-serif text-xl">Return #{r.id} · <Link href={`/admin/orders/${r.order_id}`} className="link-underline">{r.order_number}</Link></p>
                <p className="mt-1 text-sm">{r.item_name ?? "Item"}{r.qty ? ` × ${r.qty}` : ""} · {r.email} · {dateFmt(r.created_at)}</p>
                <p className="mt-2 text-sm"><strong>Reason:</strong> {r.reason}{r.details && <span className="text-charcoal/70"> — {r.details}</span>}</p>
              </div>
              <div className="text-right"><StatusBadge status={r.status} /><p className="mt-2 text-sm">Refund value {inr(r.refund_amount)}</p></div>
            </div>
            {!["rejected", "refunded"].includes(r.status) && (
              <form action={returnAction} className="mt-4 flex flex-wrap items-end gap-3 border-t border-charcoal/10 pt-4">
                <input type="hidden" name="id" value={r.id} />
                {r.status === "requested" && <><button name="intent" value="approve" className={btnCls}>Approve</button><ConfirmButton formAction={returnAction} className={btnDanger} message="Reject this return?">Reject</ConfirmButton></>}
                {r.status === "approved" && <button name="intent" value="receive" className={btnOutline}>Mark received</button>}
                {(r.status === "approved" || r.status === "received") && (
                  <div className="ml-auto flex items-end gap-2"><div><label className="mb-1 block text-[0.68rem] uppercase tracking-[0.14em] text-charcoal/65" htmlFor={`amt${r.id}`}>Refund ₹</label><input id={`amt${r.id}`} name="amount" type="number" min={1} max={r.refund_amount} defaultValue={r.refund_amount} className={fieldCls + " w-28"} /></div>
                    <button name="intent" value="refund" className={btnCls} disabled={!["paid", "partially_refunded"].includes(r.payment_status)} title={["paid", "partially_refunded"].includes(r.payment_status) ? "" : "Order has no captured payment"}>Issue refund</button></div>
                )}
              </form>
            )}
          </Panel>
        ))}
        {!rows.length && <p className="py-10 text-center text-charcoal/55">No returns here.</p>}
      </div>
    </>
  );
}
