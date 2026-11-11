import Link from "next/link";
import { all } from "@/server/db";
import { requirePerm } from "@/server/auth";
import { Notice } from "@/components/ui/Field";
import { PageHeader, Panel, btnCls, tableCls } from "@/components/admin/ui";
import { one, type SP } from "@/server/admin-marketing";

export const dynamic = "force-dynamic";
export const metadata = { title: "Collections" };

export default async function Page({ searchParams }: { searchParams: SP }) {
  await requirePerm("marketing", "/admin/collections");
  const sp = await searchParams;
  const rows = all<{ id: number; name: string; slug: string; is_featured: number; is_active: number; sort: number; n: number }>(
    "SELECT c.id, c.name, c.slug, c.is_featured, c.is_active, c.sort, (SELECT COUNT(*) FROM product_collections pc WHERE pc.collection_id = c.id) AS n FROM collections c ORDER BY c.sort, c.name");
  return (
    <>
      <PageHeader title="Collections" sub="Curated groups of products shown on the storefront." actions={<Link href="/admin/collections/new" className={btnCls}>New collection</Link>} />
      {one(sp.ok) && <div className="mb-4"><Notice tone="success">{one(sp.ok)}</Notice></div>}
      <Panel className="overflow-x-auto">
        <table className={tableCls}>
          <thead><tr><th>Name</th><th>Slug</th><th>Products</th><th>Featured</th><th>Status</th><th>Order</th><th /></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}><td className="font-medium">{r.name}</td><td className="text-charcoal/60">{r.slug}</td><td>{r.n}</td><td>{r.is_featured ? "Yes" : "—"}</td><td>{r.is_active ? "Active" : "Hidden"}</td><td>{r.sort}</td><td><Link className="underline" href={`/admin/collections/${r.id}`}>Edit</Link></td></tr>
            ))}
            {!rows.length && <tr><td colSpan={7} className="text-charcoal/60">No collections yet.</td></tr>}
          </tbody>
        </table>
      </Panel>
    </>
  );
}
