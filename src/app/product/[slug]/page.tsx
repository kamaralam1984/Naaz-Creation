import { ARTISAN_IMAGE } from "@/server/catalog-data";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/layout/PageHero";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductPurchase } from "@/components/product/ProductPurchase";
import { ProductCard } from "@/components/product/ProductCard";
import { Reviews, Stars } from "@/components/product/Reviews";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { JsonLd, JsonLdBreadcrumb } from "@/components/product/JsonLd";
import { Placeholder } from "@/components/home/Placeholder";
import { getUser } from "@/server/auth";
import { getApprovedReviews, getArtisanById, getProductBySlug, getProductCollections, getVariants, relatedProducts } from "@/server/catalog";
import { getSettings } from "@/server/settings";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const p = getProductBySlug((await params).slug);
  if (!p) return {};
  const title = p.seo_title || p.name;
  const description = p.seo_description || p.description.split("\n")[0].slice(0, 160);
  return { title, description, alternates: { canonical: `/product/${p.slug}` }, openGraph: { type: "website", title, description, images: p.images[0] ? [{ url: p.images[0] }] : undefined } };
}

function Acc({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-b border-charcoal/12">
      <summary className="flex cursor-pointer list-none items-center justify-between py-5 font-serif text-2xl [&::-webkit-details-marker]:hidden">{title}<ChevronDown size={18} className="transition-transform group-open:rotate-180" aria-hidden /></summary>
      <div className="pb-6 text-sm leading-relaxed text-charcoal/80">{children}</div>
    </details>
  );
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const p = getProductBySlug(slug);
  if (!p) notFound();
  const [user, variants, reviews, related, cols, s] = [await getUser(), getVariants(p.id), getApprovedReviews(p.id), relatedProducts(p, 4), getProductCollections(p.id), getSettings()];
  const artisan = p.artisan_id ? getArtisanById(p.artisan_id) : null;
  const gift = p.kind === "giftcard";
  const url = `${site.url.replace(/\/$/, "")}/product/${p.slug}`;
  const crumbs = [{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, ...(p.category_slug ? [{ label: p.category_name!, href: `/category/${p.category_slug}` }] : []), { label: p.name }];

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "Product", name: p.name, description: p.description.slice(0, 500), sku: p.sku, url,
        image: p.images.map((i) => (i.startsWith("http") ? i : site.url.replace(/\/$/, "") + i)), brand: { "@type": "Brand", name: site.name }, material: p.material ?? undefined,
        offers: { "@type": "Offer", url, priceCurrency: "INR", price: p.price, availability: p.stock > 0 || gift ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", itemCondition: "https://schema.org/NewCondition" },
        ...(p.rating_count > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating_avg, reviewCount: p.rating_count } } : {}),
        review: reviews.slice(0, 5).map((r) => ({ "@type": "Review", reviewRating: { "@type": "Rating", ratingValue: r.rating }, author: { "@type": "Person", name: r.name }, reviewBody: r.body })),
      }} />
      <JsonLdBreadcrumb items={crumbs.map((c) => ({ name: c.label, href: c.href ?? `/product/${p.slug}` }))} />
      <Container className="py-8 lg:py-12">
        <Breadcrumbs items={crumbs} />
        <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <ProductGallery p={p} />
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow">{p.craft ?? p.category_name}</p>
            <h1 className="mt-3 text-[length:var(--text-h1)] leading-[1.02]">{p.name}</h1>
            {p.rating_count > 0 && <a href="#reviews" className="mt-4 inline-flex items-center gap-2 text-sm"><Stars value={p.rating_avg} /> <span className="underline">{p.rating_avg.toFixed(1)} · {p.rating_count} review{p.rating_count > 1 ? "s" : ""}</span></a>}
            <p className="mt-5 max-w-lg leading-relaxed text-charcoal/80">{p.description.split("\n")[0]}</p>
            <div className="mt-7"><ProductPurchase p={p} variants={variants} /></div>
            {cols.length > 0 && <p className="mt-8 text-xs text-charcoal/60">Part of {cols.map((c, i) => <span key={c.slug}>{i > 0 && ", "}<Link href={`/collections/${c.slug}`} className="underline">{c.name}</Link></span>)}</p>}
          </div>
        </div>

        <div className="mt-20 max-w-3xl">
          <Acc title="Description" open>{p.description.split("\n\n").map((para, i) => <p key={i} className={i ? "mt-3" : ""}>{para}</p>)}</Acc>
          {!gift && <Acc title="Specifications">
            <dl className="grid grid-cols-[140px_1fr] gap-y-2">
              {p.specs.map((x) => <div key={x.label} className="contents"><dt className="text-charcoal/60">{x.label}</dt><dd>{x.value}</dd></div>)}
              {p.colors.length > 0 && <div className="contents"><dt className="text-charcoal/60">Colours</dt><dd>{p.colors.join(", ")}</dd></div>}
              <div className="contents"><dt className="text-charcoal/60">SKU</dt><dd>{p.sku}</dd></div>
            </dl>
          </Acc>}
          {p.care && <Acc title="Care instructions">{p.care}</Acc>}
          <Acc title="Shipping & returns">
            <p>Orders ship within 2–3 working days. Free standard shipping above ₹{Number(s.free_shipping_threshold).toLocaleString("en-IN")}; express delivery is available at checkout.</p>
            <p className="mt-3">{gift ? "Gift cards are delivered by email and are non-refundable." : `Returns accepted within ${s.return_window_days} days of delivery for unused pieces in original packaging.`} <Link href="/help/returns" className="underline">Read the policy</Link>.</p>
          </Acc>
        </div>

        {artisan && (
          <section className="mt-20 grid items-center gap-8 bg-beige p-8 md:grid-cols-[220px_1fr] lg:p-12" aria-labelledby="art-h">
            <div className="aspect-square overflow-hidden"><Placeholder tone={artisan.tone} label={`Portrait of ${artisan.name}`} src={ARTISAN_IMAGE[artisan.slug]} pad="p-[10%]" /></div>
            <div>
              <p className="eyebrow">Made by</p>
              <h2 id="art-h" className="mt-2 text-[length:var(--text-h3)]">{artisan.name}</h2>
              <p className="text-xs uppercase tracking-[0.16em] text-champagne-deep">{artisan.craft} · {artisan.place}</p>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-charcoal/80">{artisan.bio}</p>
              {artisan.quote && <blockquote className="mt-4 font-serif text-2xl italic text-burgundy">“{artisan.quote}”</blockquote>}
              <Link href={`/artisans/${artisan.slug}`} className="link-underline mt-5 inline-block text-xs uppercase tracking-[0.2em]">Meet {artisan.name.split(" ")[0]}</Link>
            </div>
          </section>
        )}

        <section id="reviews" className="mt-24 scroll-mt-28" aria-labelledby="rev-h">
          <p className="eyebrow">Customer reviews</p>
          <h2 id="rev-h" className="mb-10 mt-2 text-[length:var(--text-h3)]">What people say</h2>
          <Reviews productId={p.id} reviews={reviews} avg={p.rating_avg} count={p.rating_count} signedIn={!!user} userName={user?.name} />
        </section>

        {related.length > 0 && !gift && (
          <section className="mt-24" aria-labelledby="rel-h">
            <p className="eyebrow">You may also love</p>
            <h2 id="rel-h" className="mt-2 text-[length:var(--text-h3)]">Related pieces</h2>
            <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">{related.map((r) => <li key={r.id}><ProductCard p={r} /></li>)}</ul>
          </section>
        )}
        <RecentlyViewed excludeId={p.id} />
      </Container>
    </>
  );
}
