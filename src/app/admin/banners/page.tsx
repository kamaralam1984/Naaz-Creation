import Link from "next/link";
import { all, get } from "@/server/db";
import { requirePerm } from "@/server/auth";
import { getSetting } from "@/server/settings";
import { Notice } from "@/components/ui/Field";
import { PageHeader, Panel, btnCls, btnOutline, fieldCls, labelCls, tableCls } from "@/components/admin/ui";
import { HOME_SECTION_LABEL, normalizeHomeSections, one, type SP } from "@/server/admin-marketing";
import { saveAnnouncement, sectionOp, toggleBanner } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Banners & homepage" };
type B = { id: number; placement: string; title: string; subtitle: string | null; href: string | null; is_active: number; sort: number };

export default async function Page({ searchParams }: { searchParams: SP }) {
  await requirePerm("marketing", "/admin/banners");
  const sp = await searchParams;
  const banners = all<B>("SELECT * FROM banners ORDER BY placement, sort, id");
  const sections = normalizeHomeSections(get<{ value: string }>("SELECT value FROM settings WHERE key = 'home_sections'")?.value);
  return (
    <>
      <PageHeader title="Banners & homepage" sub="Promotional banners, the announcement bar and homepage section order." actions={<Link href="/admin/banners/new" className={btnCls}>New banner</Link>} />
      {one(sp.ok) && <div className="mb-4"><Notice tone="success">{one(sp.ok)}</Notice></div>}
      {one(sp.error) && <div className="mb-4"><Notice tone="error">{one(sp.error)}</Notice></div>}
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Announcement bar">
          <form action={saveAnnouncement} className="space-y-3">
            <label className={labelCls} htmlFor="announcement">Message (leave empty to hide the bar)</label>
            <input id="announcement" name="announcement" maxLength={160} defaultValue={getSetting("announcement")} className={fieldCls} />
            <button className={btnCls}>Save</button>
          </form>
        </Panel>
        <Panel title="Homepage sections">
          <ol className="divide-y divide-charcoal/10">
            {sections.map((s, i) => (
              <li key={s.key} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className={s.enabled ? "" : "text-charcoal/40 line-through"}>{i + 1}. {HOME_SECTION_LABEL[s.key]}</span>
                <form action={sectionOp} className="flex gap-1"><input type="hidden" name="key" value={s.key} />
                  <button name="op" value="up" disabled={i === 0} aria-label={`Move ${HOME_SECTION_LABEL[s.key]} up`} className={btnOutline + " !h-8 !px-2"}>↑</button>
                  <button name="op" value="down" disabled={i === sections.length - 1} aria-label={`Move ${HOME_SECTION_LABEL[s.key]} down`} className={btnOutline + " !h-8 !px-2"}>↓</button>
                  <button name="op" value="toggle" className={btnOutline + " !h-8"}>{s.enabled ? "Hide" : "Show"}</button></form>
              </li>
            ))}
          </ol>
        </Panel>
      </div>
      <Panel title="Banners" className="mt-6 overflow-x-auto">
        <table className={tableCls}><thead><tr><th>Placement</th><th>Title</th><th>Link</th><th>Order</th><th>Status</th><th /></tr></thead>
          <tbody>{banners.map((b) => (
            <tr key={b.id}><td className="capitalize">{b.placement}</td><td><p className="font-medium">{b.title}</p><p className="text-xs text-charcoal/55">{b.subtitle}</p></td><td className="text-xs">{b.href ?? "—"}</td><td>{b.sort}</td><td>{b.is_active ? "Live" : "Hidden"}</td>
              <td className="flex gap-2"><Link className={btnOutline} href={`/admin/banners/${b.id}`}>Edit</Link><form action={toggleBanner}><input type="hidden" name="id" value={b.id} /><button className={btnOutline}>{b.is_active ? "Hide" : "Show"}</button></form></td></tr>
          ))}{!banners.length && <tr><td colSpan={6} className="text-charcoal/60">No banners.</td></tr>}</tbody></table>
      </Panel>
    </>
  );
}
