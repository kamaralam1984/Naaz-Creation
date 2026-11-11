import Link from "next/link";
import { notFound } from "next/navigation";
import { get } from "@/server/db";
import { requirePerm } from "@/server/auth";
import { Notice } from "@/components/ui/Field";
import { PageHeader, Panel, btnCls, btnDanger, fieldCls, labelCls } from "@/components/admin/ui";
import { MarketingConfirmButton } from "@/components/admin/MarketingFields";
import { one, type SP } from "@/server/admin-marketing";
import { deleteCoupon, saveCoupon } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit coupon" };
type C = { id: number; code: string; description: string | null; type: string; value: number; min_order: number; max_discount: number | null; usage_limit: number | null; used_count: number; starts_at: string | null; expires_at: string | null; is_active: number };
const local = (iso: string | null) => (iso ? iso.slice(0, 16) : "");

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SP }) {
  await requirePerm("marketing", "/admin/coupons");
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const c = id === "new" ? null : get<C>("SELECT * FROM coupons WHERE id = ?", Number(id));
  if (id !== "new" && !c) notFound();
  return (
    <>
      <PageHeader title={c ? `Coupon ${c.code}` : "New coupon"} actions={<Link href="/admin/coupons" className="text-sm underline">← All coupons</Link>} />
      {one(sp.error) && <div className="mb-4"><Notice tone="error">{one(sp.error)}</Notice></div>}
      {one(sp.ok) && <div className="mb-4"><Notice tone="success">{one(sp.ok)}</Notice></div>}
      <form action={saveCoupon} className="max-w-2xl">
        <input type="hidden" name="id" value={c?.id ?? ""} />
        <Panel className="grid gap-4 sm:grid-cols-2">
          <div><label className={labelCls} htmlFor="code">Code</label><input id="code" name="code" required defaultValue={c?.code} className={fieldCls + " uppercase"} /></div>
          <div><label className={labelCls} htmlFor="type">Type</label><select id="type" name="type" defaultValue={c?.type ?? "percent"} className={fieldCls}><option value="percent">Percent off</option><option value="fixed">Fixed amount off</option><option value="freeship">Free shipping</option></select></div>
          <div className="sm:col-span-2"><label className={labelCls} htmlFor="description">Description</label><input id="description" name="description" maxLength={200} defaultValue={c?.description ?? ""} className={fieldCls} /></div>
          <div><label className={labelCls} htmlFor="value">Value (% or ₹; ignored for free shipping)</label><input id="value" name="value" type="number" min={0} defaultValue={c?.value ?? 10} className={fieldCls} /></div>
          <div><label className={labelCls} htmlFor="min_order">Minimum order (₹)</label><input id="min_order" name="min_order" type="number" min={0} defaultValue={c?.min_order ?? 0} className={fieldCls} /></div>
          <div><label className={labelCls} htmlFor="max_discount">Maximum discount (₹, optional)</label><input id="max_discount" name="max_discount" type="number" min={0} defaultValue={c?.max_discount ?? ""} className={fieldCls} /></div>
          <div><label className={labelCls} htmlFor="usage_limit">Usage limit (optional)</label><input id="usage_limit" name="usage_limit" type="number" min={1} defaultValue={c?.usage_limit ?? ""} className={fieldCls} /></div>
          <div><label className={labelCls} htmlFor="starts_at">Starts</label><input id="starts_at" name="starts_at" type="datetime-local" defaultValue={local(c?.starts_at ?? null)} className={fieldCls} /></div>
          <div><label className={labelCls} htmlFor="expires_at">Expires</label><input id="expires_at" name="expires_at" type="datetime-local" defaultValue={local(c?.expires_at ?? null)} className={fieldCls} /></div>
          {c && <p className="text-sm text-charcoal/70 sm:col-span-2">Redeemed {c.used_count} time{c.used_count === 1 ? "" : "s"} (read-only).</p>}
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="is_active" defaultChecked={c ? !!c.is_active : true} /> Active</label>
        </Panel>
        <div className="mt-4 flex gap-3"><button className={btnCls}>Save coupon</button></div>
      </form>
      {c && <form action={deleteCoupon} className="mt-6"><input type="hidden" name="id" value={c.id} /><MarketingConfirmButton message="Delete this coupon?" className={btnDanger}>Delete coupon</MarketingConfirmButton></form>}
    </>
  );
}
