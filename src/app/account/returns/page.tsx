import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/server/auth";
import { userReturns } from "@/server/account";
import { StatusBadge } from "@/components/admin/ui";
import { dateFmt, inr } from "@/lib/format";

export const metadata: Metadata = { title: "Returns & refunds" };
export const dynamic = "force-dynamic";

export default async function ReturnsPage() {
  const user = await requireUser("/account/returns");
  const list = userReturns(user.id);
  return (
    <div>
      <h2 className="font-serif text-3xl">Returns &amp; refunds</h2>
      <p className="mt-2 text-sm text-charcoal/70">Request a return from a delivered order&apos;s detail page. <Link href="/help/returns" className="link-underline">Read our returns policy</Link>.</p>
      {list.length === 0 ? <div className="mt-8 border border-dashed border-charcoal/25 p-12 text-center text-sm text-charcoal/70">No return requests.</div> : (
        <ul className="mt-8 space-y-4">
          {list.map((r) => (
            <li key={r.id} className="border border-charcoal/12 bg-white/40 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-medium">{r.item_name ?? "Item"}{r.qty && r.qty > 1 ? ` × ${r.qty}` : ""}</p>
                <StatusBadge status={r.status} />
              </div>
              <p className="mt-1 text-sm text-charcoal/70">Order <Link href={`/account/orders/${r.order_number}`} className="link-underline">{r.order_number}</Link> · requested {dateFmt(r.created_at)}</p>
              <p className="mt-2 text-sm">Reason: {r.reason}{r.details ? ` — ${r.details}` : ""}</p>
              <p className="mt-2 text-sm">Refund: <strong>{inr(r.refund_amount)}</strong> — {r.status === "refunded" ? "issued to your original payment method (5–7 business days)" : r.status === "rejected" ? "not applicable" : "pending review"}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
