import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/server/auth";
import { userAddress, userAddresses } from "@/server/account";
import { AddressForm } from "@/components/account/AccountForms";
import { defaultAddressAction, deleteAddressAction, saveAddressAction } from "../actions";

export const metadata: Metadata = { title: "Addresses" };
export const dynamic = "force-dynamic";

export default async function AddressesPage({ searchParams }: PageProps<"/account/addresses">) {
  const user = await requireUser("/account/addresses");
  const sp = await searchParams;
  const editId = Number(typeof sp.edit === "string" ? sp.edit : 0) || 0;
  const editing = editId ? userAddress(user.id, editId) : undefined;
  const list = userAddresses(user.id);
  return (
    <div className="space-y-12">
      <section>
        <h2 className="font-serif text-3xl">Address book</h2>
        {list.length === 0 ? <p className="mt-6 text-sm text-charcoal/70">You haven&apos;t saved an address yet.</p> : (
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {list.map((a) => (
              <li key={a.id} className="flex flex-col border border-charcoal/12 bg-white/40 p-5">
                <div className="flex items-center justify-between"><p className="font-medium">{a.label || a.name}</p>{a.is_default ? <span className="bg-champagne px-2 py-0.5 text-[0.62rem] uppercase tracking-[0.16em]">Default</span> : null}</div>
                <address className="mt-2 flex-1 text-sm not-italic leading-relaxed text-charcoal/80">{a.name}<br />{a.line1}{a.line2 ? <>, {a.line2}</> : null}<br />{a.city}, {a.state} {a.pincode}<br />{a.country} · {a.phone}</address>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.16em]">
                  <Link href={`/account/addresses?edit=${a.id}`} className="link-underline">Edit</Link>
                  {!a.is_default && <form action={defaultAddressAction}><input type="hidden" name="id" value={a.id} /><button className="link-underline uppercase tracking-[0.16em]">Make default</button></form>}
                  <form action={deleteAddressAction}><input type="hidden" name="id" value={a.id} /><button className="link-underline uppercase tracking-[0.16em] text-burgundy">Delete</button></form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="addr-form-h">
        <h2 id="addr-form-h" className="font-serif text-3xl">{editing ? "Edit address" : "Add a new address"}</h2>
        <div className="mt-6"><AddressForm key={editing?.id ?? "new"} action={saveAddressAction} initial={editing} cancelHref={editing ? "/account/addresses" : undefined} /></div>
      </section>
    </div>
  );
}
