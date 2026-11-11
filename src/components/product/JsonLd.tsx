import { site } from "@/lib/site";

const abs = (p: string) => (p.startsWith("http") ? p : `${site.url.replace(/\/$/, "")}${p}`);

/** Renders JSON-LD. `<` is escaped so content can never break out of the script tag. */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
export function JsonLdBreadcrumb({ items }: { items: { name: string; href: string }[] }) {
  return <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.href) })) }} />;
}
