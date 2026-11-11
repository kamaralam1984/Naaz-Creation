import type { Metadata } from "next";
import { createElement } from "react";
import { site } from "@/lib/site";
import type { Product, Review } from "@/server/types";

export const absoluteUrl = (p = "/") => new URL(p, site.url).toString();

/** Unique title/description + canonical + Open Graph for a page. */
export function pageMeta(o: { title: string; description: string; path: string; image?: string | null; noindex?: boolean }): Metadata {
  return {
    title: o.title,
    description: o.description,
    alternates: { canonical: o.path },
    openGraph: { title: `${o.title} | ${site.name}`, description: o.description, url: absoluteUrl(o.path), siteName: site.name, type: "website", ...(o.image ? { images: [{ url: absoluteUrl(o.image) }] } : {}) },
    robots: o.noindex ? { index: false, follow: false } : undefined,
  };
}

export function JsonLd({ data }: { data: unknown }) {
  return createElement("script", { type: "application/ld+json", dangerouslySetInnerHTML: { __html: JSON.stringify(data).replace(/</g, "\\u003c") } });
}

export const organizationJsonLd = () => ({
  "@context": "https://schema.org", "@type": "Organization", name: site.name, url: site.url, description: site.description, logo: absoluteUrl("/favicon.ico"),
});

export const breadcrumbJsonLd = (items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org", "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absoluteUrl(it.path) })),
});

export function productJsonLd(p: Product, reviews: Review[] = []) {
  const url = absoluteUrl(`/product/${p.slug}`);
  return {
    "@context": "https://schema.org", "@type": "Product", name: p.name, description: p.description.replace(/\s+/g, " ").slice(0, 500), sku: p.sku, url,
    image: p.images.length ? p.images.map((i) => absoluteUrl(i)) : undefined, brand: { "@type": "Brand", name: site.name }, material: p.material ?? undefined,
    offers: { "@type": "Offer", url, priceCurrency: "INR", price: p.price, availability: p.kind === "giftcard" || p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", itemCondition: "https://schema.org/NewCondition" },
    ...(p.rating_count > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating_avg, reviewCount: p.rating_count } } : {}),
    ...(reviews.length ? { review: reviews.slice(0, 5).map((r) => ({ "@type": "Review", author: { "@type": "Person", name: r.name }, reviewRating: { "@type": "Rating", ratingValue: r.rating }, reviewBody: r.body, datePublished: r.created_at.slice(0, 10) })) } : {}),
  };
}

export const faqJsonLd = (qa: { q: string; a: string }[]) => ({
  "@context": "https://schema.org", "@type": "FAQPage",
  mainEntity: qa.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })),
});
