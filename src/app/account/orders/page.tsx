import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/server/auth";
import { getOrderItems, userOrders } from "@/server/orders";
import { StatusBadge } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { dateFmt, inr } from "@/lib/format";

export const metadata: Metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await requireUser("/account/orders");
  const orders = userOrders(user.id);
  return (
    <div>
      <h2 className="font-serif text-3xl">My orders</h2>
      {orders.length === 0 ? (
        <div className="mt-8 border border-dashed border-charcoal/25 p-12 text-center"><p className="font-serif text-2xl">No orders yet</p><p className="mt-2 text-sm text-charcoal/70">Your handcrafted pieces will appear here.</p><Button href="/shop" className="mt-6">Shop now</Button></div>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((o) => {
            const items = getOrderItems(o.id);
            const needsPay = o.status !== "cancelled" && (o.payment_status === "pending" || o.payment_status === "failed");
            return (
              <li key={o.id} className="border border-charcoal/12 bg-white/40 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><p className="font-medium">{o.number}</p><p className="text-xs text-charcoal/60">Placed {dateFmt(o.created_at)}</p></div>
                  <div className="flex items-center gap-3"><StatusBadge status={o.status} />{o.payment_status !== "paid" && <StatusBadge status={o.payment_status} />}</div>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-charcoal/75">{items.map((i) => `${i.name} × ${i.qty}`).join(" · ")}</p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="font-medium">{inr(o.total)}</p>
                  <div className="flex gap-4 text-xs uppercase tracking-[0.16em]">
                    {needsPay && <Link href={`/order/${o.number}?token=${o.access_token}`} className="link-underline text-burgundy">Pay now</Link>}
                    <Link href={`/account/orders/${o.number}`} className="link-underline">View details</Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
