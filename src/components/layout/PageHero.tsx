import { Container } from "@/components/ui/Container";
import { GoldRule } from "@/components/ui/Gold";

/** Standard header band for inner pages. */
export function PageHero({ eyebrow, title, intro, children }: { eyebrow?: string; title: string; intro?: string; children?: React.ReactNode }) {
  return (
    <section className="ph-band pattern-diamond relative overflow-hidden border-b border-charcoal/10">
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-champagne/20 blur-3xl" />
      <div aria-hidden className="animate-spin-slow pointer-events-none absolute -right-16 top-1/2 hidden h-64 w-64 -translate-y-1/2 rounded-full border border-dashed border-champagne/50 lg:block" />
      <Container className="relative py-14 lg:py-20">
        {eyebrow && <div className="flex items-center gap-4"><GoldRule width="w-10" /><p className="eyebrow">{eyebrow}</p></div>}
        <h1 className="mt-3 max-w-3xl text-[length:var(--text-h1)]">{title}</h1>
        <GoldRule className="mt-6" width="w-28" delay={0.2} />
        {intro && <p className="ph-intro mt-5 max-w-2xl leading-relaxed text-charcoal/75">{intro}</p>}
        {children}
      </Container>
    </section>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs uppercase tracking-[0.16em] text-charcoal/60">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((it, i) => (
          <li key={it.label} className="flex items-center gap-2">
            {it.href ? <a href={it.href} className="link-underline">{it.label}</a> : <span aria-current="page" className="text-charcoal">{it.label}</span>}
            {i < items.length - 1 && <span aria-hidden>/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
