import Link from "next/link";
import { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { PageHero, Breadcrumbs } from "@/components/layout/PageHero";
import { ProductCard } from "@/components/product/ProductCard";
import { Filters } from "@/components/catalog/Filters";
import { SortSelect } from "@/components/catalog/SortSelect";
import { Button } from "@/components/ui/Button";
import { getFacets, getCategories, listProducts, type ListOptions, type SortKey } from "@/server/catalog";
import { parseListParams, withParams, type SP } from "@/lib/catalog-params";

/** Shared listing page: hero, filters, sort, grid, pagination. `scope` = fixed constraints for the route. */
export function CatalogView({ eyebrow, title, intro, scope, sp, defaultSort = "featured", crumbs, emptyHint }: {
  eyebrow?: string; title: string; intro?: string; scope?: ListOptions; sp: SP; defaultSort?: SortKey; crumbs: { label: string; href?: string }[]; emptyHint?: string;
}) {
  const opts = parseListParams(sp, scope ?? {}, defaultSort);
  const res = listProducts(opts);
  const facets = getFacets(scope ?? {});
  const showCategories = !scope?.category?.length;
  const cats = res.total === 0 ? getCategories().slice(0, 6) : [];
  const chips: { label: string; patch: Record<string, string | null> }[] = [];
  const csv = (k: string, label?: (v: string) => string) => (typeof sp[k] === "string" ? (sp[k] as string).split(",").filter(Boolean) : []).forEach((v) => chips.push({ label: label ? label(v) : v, patch: { [k]: (sp[k] as string).split(",").filter((x) => x !== v).join(",") || null, page: null } }));
  csv("category", (v) => facets.categories.find((c) => c.slug === v)?.name ?? v); csv("material"); csv("color"); csv("craft");
  if (sp.min || sp.max) chips.push({ label: `₹${sp.min ?? 0} – ${sp.max ? "₹" + sp.max : "any"}`, patch: { min: null, max: null, page: null } });
  if (sp.stock === "1") chips.push({ label: "In stock", patch: { stock: null, page: null } });
  if (sp.rating) chips.push({ label: `${sp.rating}★ & up`, patch: { rating: null, page: null } });
  if (sp.discount) chips.push({ label: `${sp.discount}%+ off`, patch: { discount: null, page: null } });

  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} intro={intro} />
      <Container className="py-8 lg:py-12">
        <Breadcrumbs items={crumbs} />
        <div className="mt-8 grid gap-10 lg:grid-cols-[250px_1fr]">
          <Suspense fallback={null}><Filters facets={facets} showCategories={showCategories} /></Suspense>
          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-charcoal/70" aria-live="polite">{res.total} {res.total === 1 ? "piece" : "pieces"}{opts.q ? <> for “{opts.q}”</> : null}</p>
              <div className="hidden lg:block"><Suspense fallback={null}><SortSelect defaultSort={opts.q ? "relevance" : defaultSort} withRelevance={!!opts.q} /></Suspense></div>
            </div>
            <div className="mb-6 flex items-center justify-between gap-3 lg:hidden"><Suspense fallback={null}><SortSelect defaultSort={opts.q ? "relevance" : defaultSort} withRelevance={!!opts.q} /></Suspense></div>
            {chips.length > 0 && (
              <ul className="mb-6 flex flex-wrap gap-2">{chips.map((c) => <li key={c.label}><Link href={withParams(sp, c.patch)} scroll={false} className="inline-flex items-center gap-2 border border-charcoal/30 px-3 py-1.5 text-xs hover:bg-charcoal hover:text-ivory">{c.label} <span aria-hidden>×</span><span className="sr-only">remove filter</span></Link></li>)}</ul>
            )}
            {res.items.length ? (
              <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 xl:grid-cols-3">
                {res.items.map((p, i) => <li key={p.id}><ProductCard p={p} priority={i < 3} /></li>)}
              </ul>
            ) : (
              <div className="border border-charcoal/10 bg-beige/40 p-10 text-center">
                <p className="font-serif text-3xl">Nothing matches just yet</p>
                <p className="mx-auto mt-3 max-w-md text-sm text-charcoal/70">{emptyHint ?? "Try removing a filter or exploring a category."}</p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">{cats.map((c) => <Button key={c.slug} href={`/category/${c.slug}`} variant="outline">{c.name}</Button>)}</div>
              </div>
            )}
            {res.pages > 1 && (
              <nav aria-label="Pagination" className="mt-14 flex flex-wrap items-center justify-center gap-2">
                {res.page > 1 && <Link href={withParams(sp, { page: String(res.page - 1) })} rel="prev" className="px-4 py-2 text-xs uppercase tracking-[0.16em]">← Prev</Link>}
                {Array.from({ length: res.pages }, (_, i) => i + 1).map((n) => (
                  <Link key={n} href={withParams(sp, { page: n === 1 ? null : String(n) })} aria-current={n === res.page ? "page" : undefined} className={n === res.page ? "bg-charcoal px-4 py-2 text-sm text-ivory" : "px-4 py-2 text-sm hover:bg-beige"}>{n}</Link>
                ))}
                {res.page < res.pages && <Link href={withParams(sp, { page: String(res.page + 1) })} rel="next" className="px-4 py-2 text-xs uppercase tracking-[0.16em]">Next →</Link>}
              </nav>
            )}
          </div>
        </div>
      </Container>
    </>
  );
}
