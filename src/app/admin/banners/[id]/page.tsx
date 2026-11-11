import Link from "next/link";
import { notFound } from "next/navigation";
import { get } from "@/server/db";
import { requirePerm } from "@/server/auth";
import { Notice } from "@/components/ui/Field";
import { PageHeader, Panel, btnCls, btnDanger, fieldCls, labelCls } from "@/components/admin/ui";
import { MarketingConfirmButton, MarketingImageField } from "@/components/admin/MarketingFields";
import { one, type SP } from "@/server/admin-marketing";
import { deleteBanner, saveBanner } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit banner" };
type B = { id: number; placement: string; title: string; subtitle: string | null; image: string | null; href: string | null; cta: string | null; is_active: number; sort: number };

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SP }) {
  await requirePerm("marketing", "/admin/banners");
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const b = id === "new" ? null : get<B>("SELECT * FROM banners WHERE id = ?", Number(id));
  if (id !== "new" && !b) notFound();
  return (
    <>
      <PageHeader title={b ? "Edit banner" : "New banner"} actions={<Link href="/admin/banners" className="text-sm underline">← Banners</Link>} />
      {one(sp.error) && <div className="mb-4"><Notice tone="error">{one(sp.error)}</Notice></div>}
      {one(sp.ok) && <div className="mb-4"><Notice tone="success">{one(sp.ok)}</Notice></div>}
      <form action={saveBanner} className="max-w-2xl">
        <input type="hidden" name="id" value={b?.id ?? ""} />
        <Panel className="grid gap-4 sm:grid-cols-2">
          <div><label className={labelCls} htmlFor="placement">Placement</label><select id="placement" name="placement" defaultValue={b?.placement ?? "promo"} className={fieldCls}><option value="promo">Promo</option><option value="hero">Hero</option><option value="announcement">Announcement</option></select></div>
          <div><label className={labelCls} htmlFor="sort">Sort order</label><input id="sort" name="sort" type="number" defaultValue={b?.sort ?? 0} className={fieldCls} /></div>
          <div className="sm:col-span-2"><label className={labelCls} htmlFor="title">Title</label><input id="title" name="title" required maxLength={150} defaultValue={b?.title} className={fieldCls} /></div>
          <div className="sm:col-span-2"><label className={labelCls} htmlFor="subtitle">Subtitle</label><input id="subtitle" name="subtitle" maxLength={300} defaultValue={b?.subtitle ?? ""} className={fieldCls} /></div>
          <div><label className={labelCls} htmlFor="href">Link (/path or https://…)</label><input id="href" name="href" defaultValue={b?.href ?? ""} className={fieldCls} /></div>
          <div><label className={labelCls} htmlFor="cta">Button label</label><input id="cta" name="cta" maxLength={40} defaultValue={b?.cta ?? ""} className={fieldCls} /></div>
          <div className="sm:col-span-2"><MarketingImageField name="image" label="Image" initial={b?.image} /></div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="is_active" defaultChecked={b ? !!b.is_active : true} /> Live on the storefront</label>
        </Panel>
        <div className="mt-4"><button className={btnCls}>Save banner</button></div>
      </form>
      {b && <form action={deleteBanner} className="mt-6"><input type="hidden" name="id" value={b.id} /><MarketingConfirmButton message="Delete this banner?" className={btnDanger}>Delete banner</MarketingConfirmButton></form>}
    </>
  );
}
