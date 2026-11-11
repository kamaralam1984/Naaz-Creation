import Link from "next/link";
import { requireUser } from "@/server/auth";
import { userOrders } from "@/server/orders";
import { loyaltyLedger } from "@/server/account";
import { getSetting } from "@/server/settings";
import { siteUrl } from "@/server/email";
import { StatusBadge } from "@/components/admin/ui";
import { ProfileForm, CopyButton } from "@/components/account/AccountForms";
import { updateProfileAction } from "./actions";
import { dateFmt, inr } from "@/lib/format";
import { get } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function AccountHome() {
  const user = await requireUser("/account");
  const phone = get<{ phone: string | null }>("SELECT phone FROM users WHERE id = ?", user.id)?.phone ?? "";
  const orders = userOrders(user.id).slice(0, 3);
  const ledger = loyaltyLedger(user.id);
  const reward = getSetting("referral_reward_points");
  const link = `${siteUrl()}/register?ref=${user.referral_code}`;
  return (
    <div className="space-y-12">
      <section aria-labelledby="profile-h">
        <h2 id="profile-h" className="font-serif text-3xl">Profile</h2>
        <div className="mt-6"><ProfileForm action={updateProfileAction} name={user.name} phone={phone} email={user.email} /></div>
      </section>

      <section aria-labelledby="loyalty-h" className="grid gap-6 md:grid-cols-2">
        <div className="bg-burgundy p-8 text-ivory">
          <p className="eyebrow !text-champagne">Loyalty points</p>
          <p id="loyalty-h" className="mt-3 font-serif text-6xl">{user.loyalty_points}</p>
          <p className="mt-3 text-sm text-ivory/75">Worth {inr(user.loyalty_points * (Number(getSetting("loyalty_point_value")) || 1))} — redeem at checkout.</p>
          {ledger.length > 0 && (
            <ul className="mt-5 space-y-1.5 border-t border-ivory/20 pt-4 text-xs text-ivory/80">
              {ledger.slice(0, 5).map((l) => <li key={l.id} className="flex justify-between gap-3"><span>{l.reason}</span><span>{l.points > 0 ? "+" : ""}{l.points}</span></li>)}
            </ul>
          )}
        </div>
        <div className="border border-charcoal/15 p-8">
          <p className="eyebrow">Refer a friend</p>
          <p className="mt-3 font-serif text-2xl">Share the house, earn {reward} points each.</p>
          <p className="mt-3 text-sm text-charcoal/70">When a friend signs up with your link and completes their first order, you both receive {reward} loyalty points.</p>
          <p className="mt-4 break-all bg-beige/60 px-3 py-2 text-xs">{link}</p>
          <div className="mt-4 flex items-center gap-3"><CopyButton text={link} /><span className="text-xs text-charcoal/60">Code: <strong>{user.referral_code}</strong></span></div>
        </div>
      </section>

      <section aria-labelledby="recent-h">
        <div className="flex items-end justify-between"><h2 id="recent-h" className="font-serif text-3xl">Recent orders</h2><Link href="/account/orders" className="link-underline text-xs uppercase tracking-[0.2em]">All orders</Link></div>
        {orders.length === 0 ? <p className="mt-6 text-sm text-charcoal/70">No orders yet. <Link href="/shop" className="link-underline">Start exploring</Link>.</p> : (
          <ul className="mt-6 divide-y divide-charcoal/10 border-y border-charcoal/10">
            {orders.map((o) => (
              <li key={o.id}><Link href={`/account/orders/${o.number}`} className="flex flex-wrap items-center justify-between gap-3 py-4 hover:bg-beige/30">
                <span><span className="font-medium">{o.number}</span><span className="ml-3 text-sm text-charcoal/60">{dateFmt(o.created_at)}</span></span>
                <span className="flex items-center gap-4"><StatusBadge status={o.status} /><span className="text-sm">{inr(o.total)}</span></span>
              </Link></li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
