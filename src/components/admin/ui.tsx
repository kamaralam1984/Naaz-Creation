import Link from "next/link";
import { cn } from "@/lib/cn";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/server/types";

export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="font-serif text-4xl">{title}</h1>{sub && <p className="mt-1 text-sm text-charcoal/65">{sub}</p>}</div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}
export function Panel({ title, actions, children, className }: { title?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("border border-charcoal/10 bg-white", className)}>
      {(title || actions) && <header className="flex items-center justify-between border-b border-charcoal/10 px-5 py-4"><h2 className="font-serif text-xl">{title}</h2>{actions}</header>}
      <div className="p-5">{children}</div>
    </section>
  );
}
export function StatCard({ label, value, hint, tone }: { label: string; value: string | number; hint?: string; tone?: "warn" }) {
  return (
    <div className={cn("border bg-white p-5", tone === "warn" ? "border-burgundy/40" : "border-charcoal/10")}>
      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-charcoal/60">{label}</p>
      <p className="mt-2 font-serif text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-charcoal/55">{hint}</p>}
    </div>
  );
}
const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900", confirmed: "bg-sky-100 text-sky-900", processing: "bg-indigo-100 text-indigo-900", shipped: "bg-violet-100 text-violet-900",
  out_for_delivery: "bg-fuchsia-100 text-fuchsia-900", delivered: "bg-green-100 text-green-900", cancelled: "bg-stone-200 text-stone-700", returned: "bg-orange-100 text-orange-900", refunded: "bg-rose-100 text-rose-900",
  paid: "bg-green-100 text-green-900", failed: "bg-rose-100 text-rose-900", partially_refunded: "bg-orange-100 text-orange-900",
  requested: "bg-amber-100 text-amber-900", approved: "bg-sky-100 text-sky-900", rejected: "bg-stone-200 text-stone-700", received: "bg-indigo-100 text-indigo-900",
  new: "bg-amber-100 text-amber-900", contacted: "bg-sky-100 text-sky-900", quoted: "bg-violet-100 text-violet-900", closed: "bg-stone-200 text-stone-700",
};
export function StatusBadge({ status }: { status: string }) {
  const label = (ORDER_STATUS_LABEL as Record<string, string>)[status as OrderStatus] ?? status.replace(/_/g, " ");
  return <span className={cn("inline-block px-2 py-0.5 text-[0.68rem] font-medium capitalize", STATUS_TONE[status] ?? "bg-stone-100 text-stone-700")}>{label}</span>;
}
export const tableCls = "w-full text-left text-sm [&_th]:border-b [&_th]:border-charcoal/15 [&_th]:px-3 [&_th]:py-2 [&_th]:text-[0.68rem] [&_th]:font-medium [&_th]:uppercase [&_th]:tracking-[0.14em] [&_th]:text-charcoal/60 [&_td]:border-b [&_td]:border-charcoal/8 [&_td]:px-3 [&_td]:py-3 [&_tr:hover_td]:bg-beige/30";
export const btnCls = "inline-flex h-10 items-center justify-center gap-2 bg-charcoal px-4 text-xs font-medium uppercase tracking-[0.14em] text-ivory transition-colors hover:bg-burgundy disabled:opacity-50";
export const btnOutline = "inline-flex h-10 items-center justify-center gap-2 border border-charcoal/40 px-4 text-xs font-medium uppercase tracking-[0.14em] transition-colors hover:bg-charcoal hover:text-ivory";
export const btnDanger = "inline-flex h-10 items-center justify-center gap-2 border border-danger/50 px-4 text-xs font-medium uppercase tracking-[0.14em] text-danger transition-colors hover:bg-danger hover:text-ivory";
export const fieldCls = "h-10 w-full border border-charcoal/25 bg-white px-3 text-sm focus:border-charcoal focus:outline-none";
export const labelCls = "mb-1 block text-[0.68rem] font-medium uppercase tracking-[0.14em] text-charcoal/65";

export function Pager({ page, pages, base }: { page: number; pages: number; base: string }) {
  if (pages <= 1) return null;
  const href = (p: number) => `${base}${base.includes("?") ? "&" : "?"}page=${p}`;
  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-between text-sm">
      {page > 1 ? <Link className={btnOutline} href={href(page - 1)}>← Previous</Link> : <span />}
      <span className="text-charcoal/60">Page {page} of {pages}</span>
      {page < pages ? <Link className={btnOutline} href={href(page + 1)}>Next →</Link> : <span />}
    </nav>
  );
}
