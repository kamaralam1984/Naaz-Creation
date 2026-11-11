import Link from "next/link";
import { requirePerm } from "@/server/auth";
import { adminProducts, first, intParam } from "@/server/admin-queries";
import { getCategories } from "@/server/catalog";
import { json } from "@/server/db";
import { PageHeader, Panel, Pager, btnCls, btnOutline, fieldCls, tableCls } from "@/components/admin/ui";
import { ProductArt } from "@/components/product/ProductArt";
import { toggleProductFlag } from "./actions";
import { inr } from "@/lib/format";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

export default async function AdminProducts({ searchParams }: PageProps<"/admin/products">) {
  await requirePerm("products");
  const sp = await searchParams;
  const q = first(sp.q), cat = first(sp.cat), status = first(sp.status), page = intParam(sp.page);
  const { rows, total, pages } = adminProducts({ q, cat, status, page });
  const cats = getCategories();
  const base = `/admin/products?${new URLSearchParams({ ...(q && { q }), ...(cat && { cat }), ...(status && { status }) })}`;
  return (
    <>
      <PageHeader title="Products" sub={`${total} product${total === 1 ? "" : "s"}`} actions={<Link href="/admin/products/new" className={btnCls}>+ New product</Link>} />
      {first(sp.notice) && <p role="status" className="mb-4 border border-green-800/30 bg-green-50 px-4 py-3 text-sm text-green-900">{first(sp.notice)}</p>}
      {first(sp.err) && <p role="alert" className="mb-4 border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">{first(sp.err)}</p>}
      <form className="mb-5 grid gap-3 sm:grid-cols-[1fr_180px_160px_auto]" role="search">
        <input name="q" defaultValue={q} placeholder="Search name, SKU, craft" className={fieldCls} aria-label="Search products" />
        <select name="cat" defaultValue={cat} className={fieldCls} aria-label="Category"><option value="">All categories</option>{cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select>
        <select name="status" defaultValue={status} className={fieldCls} aria-label="Status">
          <option value="">Any status</option><option value="active">Visible</option><option value="inactive">Hidden</option><option value="featured">Featured</option><option value="low">Low stock</option><option value="out">Out of stock</option>
        </select>
        <button className={btnOutline}>Filter</button>
      </form>
      <Panel className="!p-0">
        <div className="overflow-x-auto">
          <table className={tableCls}>
            <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th className="text-right">Price</th><th>Stock</th><th>Featured</th><th>Visible</th><th /></tr></thead>
            <tbody>
              {rows.map((p) => {
                const img = json<string[]>(p.images, [])[0];
                const out = p.kind === "physical" && p.stock <= 0, low = !out && p.kind === "physical" && p.stock <= p.low_stock_threshold;
                return (
                  <tr key={p.id} className={cn(!p.is_active && "opacity-60")}>
                    <td><div className="flex items-center gap-3"><span className="block h-12 w-10 shrink-0 overflow-hidden bg-beige">{img ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={img} alt="" className="h-full w-full object-contain" /> : <ProductArt tone={p.tone as "sand"} kind={p.kind === "giftcard" ? "default" : (p.category_slug ?? "default")} />}</span>
                      <div><Link href={`/admin/products/${p.id}`} className="link-underline font-medium">{p.name}</Link>{p.variant_count > 0 && <p className="text-xs text-charcoal/55">{p.variant_count} variants</p>}{p.kind === "giftcard" && <p className="text-xs text-charcoal/55">Gift card</p>}</div></div></td>
                    <td className="text-xs">{p.sku}</td><td>{p.category_name ?? "—"}</td><td className="text-right">{inr(p.price)}</td>
                    <td>{p.kind === "giftcard" ? "∞" : <span className={cn("inline-block px-2 py-0.5 text-xs", out ? "bg-rose-100 text-rose-900" : low ? "bg-amber-100 text-amber-900" : "bg-green-100 text-green-900")}>{out ? "Out" : p.stock}{low && " · low"}</span>}</td>
                    {(["featured", "active"] as const).map((f) => (
                      <td key={f}><form action={toggleProductFlag}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="field" value={f} /><input type="hidden" name="back" value={base} />
                        <button className="text-xs underline" aria-label={`Toggle ${f} for ${p.name}`}>{(f === "featured" ? p.is_featured : p.is_active) ? "Yes" : "No"}</button></form></td>
                    ))}
                    <td><Link href={`/admin/products/${p.id}`} className="link-underline text-xs uppercase tracking-[0.14em]">Edit</Link></td>
                  </tr>
                );
              })}
              {!rows.length && <tr><td colSpan={8} className="py-10 text-center text-charcoal/55">No products match.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
      <Pager page={page} pages={pages} base={base} />
    </>
  );
}
