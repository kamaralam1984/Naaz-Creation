import Link from "next/link";
import { notFound } from "next/navigation";
import { get, json } from "@/server/db";
import { requirePerm } from "@/server/auth";
import { Notice } from "@/components/ui/Field";
import { PageHeader, Panel, StatusBadge, btnCls, btnOutline, fieldCls, labelCls } from "@/components/admin/ui";
import { one, type SP } from "@/server/admin-marketing";
import { dateFmt } from "@/lib/format";
import { addEnquiryNote, setEnquiryStatus } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Enquiry" };
type E = { id: number; type: string; name: string; email: string; phone: string | null; company: string | null; quantity: number | null; budget: string | null; message: string | null; details: string | null; status: string; created_at: string };

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SP }) {
  await requirePerm("enquiries", "/admin/enquiries");
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const e = get<E>("SELECT * FROM enquiries WHERE id = ?", Number(id));
  if (!e) notFound();
  const { notes = [], ...rest } = json<Record<string, unknown> & { notes?: { at: string; by: string; text: string }[] }>(e.details, {});
  const subject = encodeURIComponent(`Re: your ${e.type} enquiry`);
  return (
    <>
      <PageHeader title={`${e.type[0].toUpperCase() + e.type.slice(1)} enquiry #${e.id}`} sub={`Received ${dateFmt(e.created_at)}`} actions={<Link href="/admin/enquiries" className="text-sm underline">← All enquiries</Link>} />
      {one(sp.ok) && <div className="mb-4"><Notice tone="success">{one(sp.ok)}</Notice></div>}
      {one(sp.error) && <div className="mb-4"><Notice tone="error">{one(sp.error)}</Notice></div>}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Panel title="Request">
            <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
              {([["Name", e.name], ["Email", e.email], ["Phone", e.phone], ["Company", e.company], ["Quantity", e.quantity], ["Budget", e.budget]] as const).map(([k, v]) => (
                <div key={k}><dt className="text-[0.68rem] uppercase tracking-[0.14em] text-charcoal/55">{k}</dt><dd>{v ?? "—"}</dd></div>
              ))}
            </dl>
            {e.message && <p className="mt-5 whitespace-pre-wrap border-t border-charcoal/10 pt-4 text-sm leading-relaxed">{e.message}</p>}
            {Object.keys(rest).length > 0 && (
              <dl className="mt-5 grid gap-3 border-t border-charcoal/10 pt-4 text-sm sm:grid-cols-2">
                {Object.entries(rest).map(([k, v]) => <div key={k}><dt className="text-[0.68rem] uppercase tracking-[0.14em] text-charcoal/55">{k.replace(/_/g, " ")}</dt><dd className="whitespace-pre-wrap break-words">{typeof v === "object" ? JSON.stringify(v) : String(v)}</dd></div>)}
              </dl>
            )}
          </Panel>
          <Panel title="Internal notes">
            <ul className="space-y-3 text-sm">
              {notes.map((n, i) => <li key={i} className="border-l-2 border-champagne-deep pl-3"><p>{n.text}</p><p className="text-xs text-charcoal/55">{n.by} · {new Date(n.at).toLocaleString("en-IN")}</p></li>)}
              {!notes.length && <li className="text-charcoal/60">No notes yet.</li>}
            </ul>
            <form action={addEnquiryNote} className="mt-4 space-y-2">
              <input type="hidden" name="id" value={e.id} />
              <label className={labelCls} htmlFor="note">Add a note</label>
              <textarea id="note" name="note" rows={3} maxLength={1000} required className={fieldCls + " h-auto py-2"} />
              <button className={btnCls}>Add note</button>
            </form>
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Status"><p className="mb-4"><StatusBadge status={e.status} /></p>
            <form action={setEnquiryStatus} className="flex flex-wrap gap-2"><input type="hidden" name="id" value={e.id} />
              {(["new", "contacted", "quoted", "closed"] as const).filter((s) => s !== e.status).map((s) => <button key={s} name="status" value={s} className={btnOutline}>Mark {s}</button>)}
            </form>
          </Panel>
          <Panel title="Reply"><a className={btnCls} href={`mailto:${e.email}?subject=${subject}`}>Email {e.name.split(" ")[0]}</a>{e.phone && <a className={btnOutline + " mt-3 w-full"} href={`tel:${e.phone}`}>Call {e.phone}</a>}</Panel>
        </div>
      </div>
    </>
  );
}
