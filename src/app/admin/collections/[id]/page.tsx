import Link from "next/link";
import { notFound } from "next/navigation";
import { all, get } from "@/server/db";
import { requirePerm } from "@/server/auth";
import { Notice } from "@/components/ui/Field";
import { PageHeader, Panel, btnCls, btnDanger, fieldCls, labelCls } from "@/components/admin/ui";
import { MarketingConfirmButton, MarketingImageField, MarketingProductPicker } from "@/components/admin/MarketingFields";
import { one, TONES, type SP } from "@/server/admin-marketing";
import type { Collection } from "@/server/types";
import { deleteCollection, saveCollection } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit collection" };

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SP }) {
  await requirePerm("marketing", "/admin/collections");
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const isNew = id === "new";
  const c = isNew ? null : get<Collection>("SELECT * FROM collections WHERE id = ?", Number(id));
  if (!isNew && !c) notFound();
  const products = all<{ id: number; name: string; sku: string }>("SELECT id, name, sku FROM products WHERE kind = 'physical' ORDER BY name");
  const selected = c ? all<{ product_id: number }>("SELECT product_id FROM product_collections WHERE collection_id = ?", c.id).map((r) => r.product_id) : [];
  return (
    <>
      <PageHeader title={c ? c.name : "New collection"} actions={<Link href="/admin/collections" className="text-sm underline">← All collections</Link>} />
      {one(sp.error) && <div className="mb-4"><Notice tone="error">{one(sp.error)}</Notice></div>}
      {one(sp.ok) && <div className="mb-4"><Notice tone="success">{one(sp.ok)}</Notice></div>}
      <form action={saveCollection} className="grid gap-6 lg:grid-cols-2">
        <input type="hidden" name="id" value={c?.id ?? ""} />
        <Panel title="Details" className="space-y-4">
          <div><label className={labelCls} htmlFor="name">Name</label><input id="name" name="name" required defaultValue={c?.name} className={fieldCls} /></div>
          <div><label className={labelCls} htmlFor="slug">Slug</label><input id="slug" name="slug" defaultValue={c?.slug} placeholder="auto from name" className={fieldCls} /></div>
          <div><label className={labelCls} htmlFor="blurb">Short blurb</label><input id="blurb" name="blurb" maxLength={200} defaultValue={c?.blurb ?? ""} className={fieldCls} /></div>
          <div><label className={labelCls} htmlFor="description">Description</label><textarea id="description" name="description" rows={4} defaultValue={c?.description ?? ""} className={fieldCls + " h-auto py-2"} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls} htmlFor="tone">Colour tone</label><select id="tone" name="tone" defaultValue={c?.tone ?? "sand"} className={fieldCls}>{TONES.map((t) => <option key={t}>{t}</option>)}</select></div>
            <div><label className={labelCls} htmlFor="sort">Sort order</label><input id="sort" name="sort" type="number" defaultValue={c?.sort ?? 0} className={fieldCls} /></div>
          </div>
          <MarketingImageField name="image" label="Cover image" initial={c?.image} />
          <div className="flex gap-6 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" name="is_featured" defaultChecked={!!c?.is_featured} /> Featured on homepage</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="is_active" defaultChecked={c ? !!c.is_active : true} /> Visible</label>
          </div>
        </Panel>
        <Panel title="Products in this collection"><MarketingProductPicker products={products} selected={selected} /></Panel>
        <div className="flex gap-3 lg:col-span-2"><button className={btnCls}>Save collection</button></div>
      </form>
      {c && (
        <form action={deleteCollection} className="mt-6">
          <input type="hidden" name="id" value={c.id} />
          <MarketingConfirmButton message="Delete this collection? Products are kept." className={btnDanger}>Delete collection</MarketingConfirmButton>
        </form>
      )}
    </>
  );
}
