import { ARTISAN_IMAGE } from "@/server/catalog-data";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Hand, Globe2, ShieldCheck, Quote, Camera } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Placeholder } from "@/components/home/Placeholder";
import { Hero } from "@/components/home/Hero";
import { Newsletter } from "@/components/home/Newsletter";
import { ProductCard } from "@/components/product/ProductCard";
import { JsonLd } from "@/components/product/JsonLd";
import { all, get } from "@/server/db";
import { getArtisans, getCategories, getCollections, listProducts } from "@/server/catalog";
import { normalizeHomeSections } from "@/server/admin-marketing";
import { site } from "@/lib/site";
import { gallery, testimonials } from "@/lib/data/home";
import { GoldRule } from "@/components/ui/Gold";
import { getTheme } from "@/lib/theme";
import { HeroCarousel } from "@/components/home/t2/HeroCarousel";
import { BestsellerTabs } from "@/components/home/t2/BestsellerTabs";
import { RotateCcw, Truck, Gift as GiftIcon } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { absolute: `${site.name} — ${site.tagline}` }, description: site.description, alternates: { canonical: "/" } };

const crafts = [
  { label: "Golden Straw Art", region: "Lucknow, Uttar Pradesh", tone: "brass", href: "/collections/golden-straw", image: "/catalog/golden-tree-of-life-frame.webp" },
  { label: "Madhubani", region: "Madhubani, Bihar", tone: "wine", href: "/search?q=madhubani", image: "/catalog/madhubani-framed-panel.webp" },
  { label: "Hand Smocking", region: "Panipat, Haryana", tone: "wine", href: "/category/cushions", image: "/catalog/pink-satin-round-cushion.webp" },
  { label: "Mirror & Mosaic", region: "Moradabad, Uttar Pradesh", tone: "ink", href: "/category/wall-hangings", image: "/catalog/buddha-mosaic-wall-plate.webp" },
] as const;
const occasions = [
  { label: "Weddings", tone: "wine", href: "/category/framed-art", image: "/catalog/zardozi-charkha-frame.webp" },
  { label: "Festive", tone: "brass", href: "/collections/mirror-mosaic", image: "/catalog/red-mirror-mosaic-plate.webp" },
  { label: "Housewarming", tone: "clay", href: "/category/wall-hangings", image: "/catalog/woven-tree-wall-hanging.webp" },
  { label: "Anniversaries", tone: "sand", href: "/category/flowers", image: "/catalog/paper-rose-basket-bouquet.webp" },
  { label: "Corporate", tone: "ink", href: "/gifting/corporate", image: "/catalog/golden-tree-of-life-frame.webp" },
] as const;
const promises = [
  { icon: Hand, title: "Made by hand", body: "Every piece is shaped, painted or cast by a single artisan — never a factory line." },
  { icon: ShieldCheck, title: "Heirloom quality", body: "Natural materials and traditional methods, built to be passed down." },
  { icon: Globe2, title: "Delivered worldwide", body: "Carefully packed in India and shipped to your door, wherever that is." },
] as const;

function Photo({ src, tone, label, sizes, pad = "p-3" }: { src?: string | null; tone: "clay" | "brass" | "wine" | "sand" | "ink"; label: string; sizes: string; pad?: string }) {
  return src ? <Image src={src} alt={label} fill sizes={sizes} className={`object-contain ${pad}`} /> : <Placeholder tone={tone} label={label} />;
}

function SectionHead({ eyebrow, title, href, cta = "View all" }: { eyebrow: string; title: string; href?: string; cta?: string }) {
  return (
    <Reveal className="flex flex-wrap items-end justify-between gap-6">
      <div><p className="eyebrow flex items-center gap-3"><span aria-hidden className="h-1.5 w-1.5 rotate-45 bg-champagne" />{eyebrow}</p><h2 className="mt-3 text-[length:var(--text-h2)]">{title}</h2><GoldRule className="mt-5" width="w-24" delay={0.15} /></div>
      {href && <Link href={href} className="link-underline group/c inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] hover:text-burgundy">{cta} <ArrowRight size={14} className="transition-transform duration-300 group-hover/c:translate-x-1.5" aria-hidden /></Link>}
    </Reveal>
  );
}
const Grid = ({ children }: { children: React.ReactNode }) => <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">{children}</ul>;

/* ───────────── Theme 2 (green & gold) building blocks ───────────── */
const CIRCLES: [string, string, string][] = [
  ["Home Decor", "/category/pottery", "elephant-ear-terracotta-vase"], ["Paintings & Wall Art", "/category/framed-art", "golden-tree-of-life-frame"],
  ["Cushions & Bolsters", "/category/cushions", "teal-flower-cushion"], ["Wall Hangings", "/category/wall-hangings", "woven-tree-wall-hanging"],
  ["Mirror & Mosaic", "/collections/mirror-mosaic", "red-mirror-mosaic-plate"], ["Everlasting Flowers", "/category/flowers", "paper-rose-basket-bouquet"],
  ["Bags & Accessories", "/category/bags", "madhubani-jute-sling-bag"], ["Corporate Gifts", "/gifting/corporate", "shell-sun-framed-art"],
  ["Personalized Gifts", "/gifting/hampers", "jute-cone-flower-bouquet"], ["Festive Collection", "/sale", "buddha-mosaic-wall-plate"],
];
const BANNERS = [
  { title: "Decor for Every Space", sub: "Home Décor Collection", cta: "Shop Now", href: "/shop", img: "paper-rose-basket-bouquet", bg: "from-[#46552e] via-[#2c3a1d] to-[#1a2412]" },
  { title: "Corporate Gifting", sub: "Impress with Handcrafted Gifts", cta: "Enquire Now", href: "/gifting/corporate", img: "golden-tree-of-life-frame", bg: "from-[#7a4426] via-[#53301a] to-[#34200f]" },
  { title: "Festive Collection", sub: "Celebrate Indian Art & Culture", cta: "Shop Now", href: "/sale", img: "red-mirror-mosaic-plate", bg: "from-[#5b2a22] via-[#3a1a14] to-[#1f0e09]" },
];
const TRUST = [
  { icon: Truck, t: "Pan India Delivery", s: "Safe & Reliable" }, { icon: ShieldCheck, t: "Secure Payments", s: "100% Safe Checkout" },
  { icon: RotateCcw, t: "Easy Returns", s: "Hassle-Free" }, { icon: GiftIcon, t: "Gift Ready Packaging", s: "Perfect for Every Occasion" },
];
function CenterHead({ title }: { title: string }) {
  return (
    <Reveal className="flex items-center justify-center gap-3 sm:gap-5">
      <GoldRule width="w-10 sm:w-24" className="origin-right" /><span aria-hidden className="h-1.5 w-1.5 rotate-45 bg-champagne" />
      <h2 className="text-center font-serif text-[1.7rem] font-medium sm:text-4xl">{title}</h2>
      <span aria-hidden className="h-1.5 w-1.5 rotate-45 bg-champagne" /><GoldRule width="w-10 sm:w-24" delay={0.15} />
    </Reveal>
  );
}
function TrustStrip() {
  return (
    <div className="border-b border-champagne/30 bg-[#f3e9d6]">
      <Container className="grid grid-cols-2 gap-y-4 py-4 md:grid-cols-4">
        {TRUST.map(({ icon: Icon, t, s }, k) => (
          <div key={t} className={`flex items-center justify-center gap-3 ${k > 0 ? "md:border-l md:border-champagne/40" : ""}`}>
            <Icon size={28} strokeWidth={1.3} className="shrink-0 text-[#0f3d2e]" aria-hidden />
            <div className="text-left"><p className="text-[0.78rem] font-semibold">{t}</p><p className="text-[0.68rem] text-charcoal/65">{s}</p></div>
          </div>
        ))}
      </Container>
    </div>
  );
}

export default async function Home() {
  const theme = await getTheme();
  const sections = normalizeHomeSections(get<{ value: string }>("SELECT value FROM settings WHERE key = 'home_sections'")?.value);
  const on = new Set(sections.filter((s) => s.enabled).map((s) => s.key));
  const order0 = sections.map((s) => s.key);

  const categories = getCategories();
  const featuredCols = getCollections(true);
  const best = listProducts({ flag: "bestseller", sort: "best_selling", perPage: 4 }).items;
  const fresh = listProducts({ flag: "new", sort: "newest", perPage: 4 }).items;
  const artisans = getArtisans().slice(0, 3);
  const t2 = theme === "2" ? {
    best: listProducts({ flag: "bestseller", sort: "best_selling", perPage: 10 }).items,
    fresh: listProducts({ flag: "new", sort: "newest", perPage: 10 }).items,
    sale: listProducts({ flag: "sale", sort: "best_selling", perPage: 10 }).items,
  } : null;
  const promo = all<{ title: string; subtitle: string | null; href: string | null; cta: string | null }>("SELECT * FROM banners WHERE placement = 'promo' AND is_active = 1 ORDER BY sort, id LIMIT 3");
  const hero = get<{ title: string; subtitle: string | null; href: string | null; cta: string | null }>("SELECT * FROM banners WHERE placement = 'hero' AND is_active = 1 ORDER BY sort, id LIMIT 1");

  const blocks: Record<string, React.ReactNode> = {
    categories: (
      <section className="pt-24 lg:pt-32">
        <Container>
          <SectionHead eyebrow="Shop by craft" title="Find your piece" href="/shop" />
          <ul className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-6">
            {categories.map((c, i) => (
              <li key={c.slug}><Reveal delay={(i % 4) * 0.08}>
                <Link href={`/category/${c.slug}`} className="group block">
                  <div className="gold-corners aspect-[4/5] overflow-hidden bg-gradient-to-b from-beige to-[#e2d6c2]"><div className="relative h-full transition-transform duration-[1200ms] ease-[var(--ease-luxe)] group-hover:scale-[1.06]"><Photo src={c.image} tone={c.tone} label={c.name} sizes="(min-width:1024px) 17vw, 33vw" pad="p-4" /></div></div>
                  <div className="mt-4 flex items-center justify-between"><h3 className="font-serif text-xl leading-tight">{c.name}</h3><ArrowRight size={18} className="transition-transform duration-[400ms] group-hover:translate-x-1" aria-hidden /></div>
                  <p className="text-xs uppercase tracking-[0.16em] text-charcoal/55">{c.count} {c.count === 1 ? "piece" : "pieces"}</p>
                </Link>
              </Reveal></li>
            ))}
          </ul>
        </Container>
      </section>
    ),
    collections: featuredCols.length > 0 && (
      <section className="pt-24 lg:pt-32">
        <Container>
          <SectionHead eyebrow="Curated" title="Featured collections" href="/collections" />
          <ul className="mt-12 grid gap-4 md:grid-cols-3 md:gap-6">
            {featuredCols.slice(0, 3).map((c, i) => (
              <li key={c.slug}><Reveal delay={i * 0.1}>
                <Link href={`/collections/${c.slug}`} className="group gold-corners relative block aspect-[3/4] overflow-hidden bg-beige text-ivory">
                  <div className="absolute inset-0 transition-transform duration-[1200ms] ease-[var(--ease-luxe)] group-hover:scale-[1.06]"><Photo src={c.image} tone={c.tone} label={c.name} sizes="(min-width:768px) 33vw, 100vw" pad="px-8 pt-8 pb-36" /></div>
                  <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-charcoal/90 via-charcoal/60 to-transparent" aria-hidden />
                  <div className="absolute inset-x-0 bottom-0 p-7"><h3 className="font-serif text-3xl">{c.name}</h3><p className="mt-2 text-sm text-ivory/80">{c.blurb}</p></div>
                </Link>
              </Reveal></li>
            ))}
          </ul>
        </Container>
      </section>
    ),
    bestsellers: best.length > 0 && (
      <section className="pt-24 lg:pt-32"><Container><SectionHead eyebrow="Loved most" title="Best sellers" href="/best-sellers" /><Grid>{best.map((p, i) => <li key={p.id}><Reveal delay={i * 0.08}><ProductCard p={p} /></Reveal></li>)}</Grid></Container></section>
    ),
    new: fresh.length > 0 && (
      <section className="pt-24 lg:pt-32"><Container><SectionHead eyebrow="Just in" title="New arrivals" href="/new-arrivals" /><Grid>{fresh.map((p, i) => <li key={p.id}><Reveal delay={i * 0.08}><ProductCard p={p} /></Reveal></li>)}</Grid></Container></section>
    ),
    offers: (
      <section className="pt-24 lg:pt-32">
        <Container>
          <SectionHead eyebrow="Members & first orders" title="Exclusive offers" href="/sale" cta="Shop sale" />
          <ul className="mt-12 grid gap-4 md:grid-cols-3 md:gap-6">
            {all<{ code: string; description: string | null }>("SELECT code, description FROM coupons WHERE is_active = 1 AND (expires_at IS NULL OR expires_at > datetime('now')) ORDER BY id LIMIT 3").map((o, i) => (
              <li key={o.code}><Reveal delay={i * 0.1}><div className="h-full border border-champagne-deep/40 bg-beige/50 p-8"><h3 className="font-serif text-3xl">{o.description}</h3><p className="mt-6 inline-block border border-dashed border-charcoal/40 px-3 py-1.5 text-xs uppercase tracking-[0.2em]">Code · {o.code}</p></div></Reveal></li>
            ))}
          </ul>
        </Container>
      </section>
    ),
    artisans: artisans.length > 0 && (
      <section className="mt-24 bg-beige py-20 lg:mt-32 lg:py-28">
        <Container>
          <SectionHead eyebrow="Meet the makers" title="Artisan stories" href="/artisans" cta="All artisans" />
          <ul className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {artisans.map((a, i) => (
              <li key={a.slug}><Reveal delay={i * 0.1}>
                <Link href={`/artisans/${a.slug}`} className="group block">
                  <div className="aspect-[4/5] overflow-hidden"><div className="h-full transition-transform duration-[1200ms] group-hover:scale-[1.04]"><Placeholder tone={a.tone} label={`Portrait of ${a.name}`} src={ARTISAN_IMAGE[a.slug]} pad="p-[10%]" /></div></div>
                  <blockquote className="mt-6 font-serif text-2xl leading-snug">&ldquo;{a.quote}&rdquo;</blockquote>
                  <p className="mt-4 text-sm font-medium">{a.name}</p><p className="text-xs uppercase tracking-[0.18em] text-champagne-deep">{a.craft} · {a.place}</p>
                </Link>
              </Reveal></li>
            ))}
          </ul>
        </Container>
      </section>
    ),
    crafts: (
      <section className="pt-24 lg:pt-32">
        <Container>
          <SectionHead eyebrow="Heritage" title="Discover Indian crafts" href="/about" cta="Our story" />
          <ul className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            {crafts.map((c, i) => (
              <li key={c.label}><Reveal delay={i * 0.08}>
                <Link href={c.href} className="group block"><div className="gold-corners aspect-square overflow-hidden bg-gradient-to-b from-beige to-[#e2d6c2]"><div className="relative h-full transition-transform duration-[1200ms] ease-[var(--ease-luxe)] group-hover:scale-[1.06]"><Photo src={c.image} tone={c.tone} label={c.label} sizes="(min-width:1024px) 25vw, 50vw" /></div></div>
                  <h3 className="mt-4 font-serif text-2xl">{c.label}</h3><p className="text-xs uppercase tracking-[0.18em] text-charcoal/60">{c.region}</p></Link>
              </Reveal></li>
            ))}
          </ul>
        </Container>
      </section>
    ),
    occasions: (
      <section className="pt-24 lg:pt-32">
        <Container>
          <SectionHead eyebrow="Gift with intention" title="Shop by occasion" href="/gifting/occasions" />
          <ul className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-5 md:gap-5">
            {occasions.map((o, i) => (
              <li key={o.label} className={i === 0 ? "col-span-2 md:col-span-1" : ""}><Reveal delay={i * 0.06}>
                <Link href={o.href} className="group gold-corners relative block aspect-[4/5] overflow-hidden bg-beige text-ivory">
                  <div className="absolute inset-0 transition-transform duration-[1200ms] ease-[var(--ease-luxe)] group-hover:scale-[1.06]"><Photo src={o.image} tone={o.tone} label={o.label} sizes="(min-width:768px) 20vw, 50vw" pad="px-4 pt-4 pb-16" /></div>
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-charcoal/85 to-transparent" aria-hidden />
                  <h3 className="absolute inset-x-0 bottom-0 p-5 font-serif text-2xl">{o.label}</h3>
                </Link>
              </Reveal></li>
            ))}
          </ul>
        </Container>
      </section>
    ),
    corporate: (
      <section className="mt-24 bg-charcoal text-ivory lg:mt-32">
        <Container className="grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <Reveal><p className="eyebrow !text-champagne">Corporate gifting</p></Reveal>
            <Reveal delay={0.1}><h2 className="mt-3 text-[length:var(--text-h2)]">Gifts your clients will keep.</h2></Reveal>
            <Reveal delay={0.2}><p className="mt-6 max-w-md leading-relaxed text-ivory/75">Bulk orders, custom logo engraving and curated hampers — packed beautifully and delivered across India and abroad.</p></Reveal>
            <Reveal delay={0.3} className="mt-9 flex flex-wrap gap-4"><Button href="/gifting/corporate" variant="gold">Plan a corporate order</Button><Button href="/gifting/hampers" variant="outline" className="!border-ivory !text-ivory hover:!bg-ivory hover:!text-charcoal">Custom hampers</Button></Reveal>
          </div>
          <Reveal><div className="gold-corners relative aspect-[4/3]"><Placeholder tone="ink" label="Corporate gift hamper" /></div></Reveal>
        </Container>
      </section>
    ),
    testimonials: (
      <section className="pt-24 lg:pt-32">
        <Container>
          <SectionHead eyebrow="Kind words" title="From our customers" />
          <ul className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {testimonials.map((t, i) => (
              <li key={t.name}><Reveal delay={i * 0.1}><Quote size={28} strokeWidth={1.25} className="text-champagne-deep" aria-hidden /><p className="mt-4 font-serif text-2xl leading-snug">{t.quote}</p><p className="mt-5 text-sm font-medium">{t.name}</p><p className="text-xs uppercase tracking-[0.18em] text-charcoal/60">{t.city}</p></Reveal></li>
            ))}
          </ul>
        </Container>
      </section>
    ),
    gallery: (
      <section className="pt-24 lg:pt-32">
        <Container>
          <SectionHead eyebrow="@nazicreation" title="In the wild" />
          <ul className="mt-12 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {gallery.map((tone, i) => (
              <li key={i}><Reveal delay={(i % 4) * 0.06}>
                <a href="https://instagram.com/nazicreation" target="_blank" rel="noopener noreferrer" className="group relative block aspect-square overflow-hidden" aria-label={`Instagram post ${i + 1}`}>
                  <div className="h-full transition-transform duration-[1200ms] ease-[var(--ease-luxe)] group-hover:scale-[1.08]"><Placeholder tone={tone} label={`Gallery image ${i + 1}`} /></div>
                  <span className="absolute inset-0 flex items-center justify-center bg-charcoal/40 text-ivory opacity-0 transition-opacity duration-[400ms] group-hover:opacity-100"><Camera size={26} aria-hidden /></span>
                </a>
              </Reveal></li>
            ))}
          </ul>
        </Container>
      </section>
    ),
    newsletter: (
      <section className="mt-24 bg-beige lg:mt-32">
        <Container className="flex flex-col items-start gap-8 py-20 md:flex-row md:items-center md:justify-between">
          <Reveal className="max-w-md"><p className="eyebrow">Newsletter</p><h2 className="mt-3 text-[length:var(--text-h3)]">Stories from the workshop, first access to new pieces.</h2></Reveal>
          <Reveal className="w-full md:w-auto"><Newsletter /></Reveal>
        </Container>
      </section>
    ),
  };

  const order = t2 ? (["categories", "collections", "bestsellers", "artisans", ...order0.filter((k) => !["categories", "collections", "bestsellers", "artisans"].includes(k))] as typeof order0) : order0;
  if (t2) {
    blocks.categories = (
      <section className="pt-12 lg:pt-14"><Container>
        <CenterHead title="Shop by Category" />
        <ul className="mt-8 flex gap-5 overflow-x-auto pb-3 [scrollbar-width:none] lg:justify-between lg:overflow-visible [&::-webkit-scrollbar]:hidden">
          {CIRCLES.map(([label, href, img], k) => (
            <li key={label} className="shrink-0"><Reveal delay={k * 0.05}>
              <Link href={href} className="group flex w-[84px] flex-col items-center text-center lg:w-[96px]">
                <span className="relative block h-[84px] w-[84px] rounded-full bg-gradient-to-b from-[#f6e8d2] to-[#ecd6b6] p-1 shadow-[0_6px_16px_-8px_rgb(38_35_31/0.4)] transition-all duration-500 group-hover:-translate-y-1.5 group-hover:shadow-[0_0_0_2px_var(--champagne),0_14px_24px_-10px_rgb(38_35_31/0.5)] lg:h-[96px] lg:w-[96px]">
                  <span className="relative block h-full w-full overflow-hidden rounded-full"><Image src={`/catalog/${img}.webp`} alt="" fill sizes="96px" className="object-contain p-2.5 transition-transform duration-700 group-hover:scale-110" /></span>
                </span>
                <span className="mt-2.5 text-[0.72rem] font-medium leading-tight text-charcoal transition-colors group-hover:text-[#0f3d2e]">{label}</span>
              </Link>
            </Reveal></li>
          ))}
        </ul>
      </Container></section>
    );
    blocks.collections = (
      <section className="pt-12 lg:pt-14"><Container>
        <CenterHead title="Featured Collections" />
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {BANNERS.map((b, k) => (
            <li key={b.title}><Reveal delay={k * 0.1}>
              <Link href={b.href} className={`group gold-corners relative flex h-44 items-center overflow-hidden rounded-lg bg-gradient-to-br ${b.bg} p-6 text-ivory shadow-md`}>
                <div aria-hidden className="absolute -right-6 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-amber-400/25 blur-3xl" />
                <div className="relative z-10 max-w-[55%]">
                  <h3 className="font-serif text-[1.65rem] leading-tight">{b.title}</h3>
                  <p className="mt-1 text-[0.72rem] text-ivory/85">{b.sub}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 rounded-[3px] bg-champagne px-3.5 py-1.5 text-[0.7rem] font-semibold text-charcoal transition-colors group-hover:bg-[var(--gold-hi)]">{b.cta} →</span>
                </div>
                <div className="absolute inset-y-3 right-3 w-[42%]"><Image src={`/catalog/${b.img}.webp`} alt="" fill sizes="20vw" className="object-contain drop-shadow-[0_14px_18px_rgba(0,0,0,0.5)] transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-3" /></div>
              </Link>
            </Reveal></li>
          ))}
        </ul>
      </Container></section>
    );
    blocks.bestsellers = (
      <section className="pt-12 lg:pt-14"><Container>
        <CenterHead title="Bestsellers" />
        <div className="mt-6"><BestsellerTabs data={t2} /></div>
      </Container></section>
    );
    blocks.artisans = (
      <section className="mt-14 overflow-hidden lg:mt-16">
        <div className="grid min-h-[300px] md:grid-cols-[1fr_1.05fr]">
          <div className="relative min-h-[260px] bg-gradient-to-br from-[#9a5530] via-[#6b3820] to-[#3a1d0e]">
            <div aria-hidden className="absolute left-1/4 top-1/3 h-56 w-56 rounded-full bg-amber-300/30 blur-3xl" />
            {[["elephant-ear-terracotta-vase", "left-[8%] bottom-[8%] h-[86%] aspect-[0.41]", 3], ["sunflower-velvet-cushion", "left-[34%] bottom-[6%] h-[44%] aspect-square", 2], ["red-mirror-mosaic-plate", "left-[50%] top-[10%] h-[46%] aspect-square", 1], ["teal-flower-cushion", "right-[6%] bottom-[8%] h-[40%] aspect-square", 4]].map(([s, c, z], k) => (
              <div key={String(s)} className={`animate-float absolute ${c}`} style={{ zIndex: Number(z), animationDelay: `${-k * 1.4}s` }}><Image src={`/catalog/${s}.webp`} alt="" fill sizes="20vw" className="object-contain drop-shadow-[0_16px_20px_rgba(0,0,0,0.5)]" /></div>
            ))}
          </div>
          <div className="pattern-diamond relative flex items-center bg-[#f6ecd8] px-8 py-12 sm:px-14">
            <svg aria-hidden viewBox="0 0 200 260" className="absolute -right-6 top-0 h-full w-auto text-champagne opacity-50">
              {[[120, 40, 20], [150, 100, -15], [100, 120, 35], [160, 180, 10], [110, 200, -30], [60, 70, 50]].map(([x, y, r], k) => <path key={k} transform={`translate(${x} ${y}) rotate(${r})`} d="M0 0C25-18 58-6 70 30 38 36 12 30 0 0Z" fill="currentColor" />)}
            </svg>
            <Reveal className="relative max-w-md">
              <p className="text-[0.68rem] font-medium uppercase tracking-[0.32em] text-charcoal/70">The people behind the craft</p>
              <h2 className="mt-3 font-serif text-4xl sm:text-5xl">Meet Our Artisans</h2>
              <GoldRule className="mt-5" width="w-24" />
              <p className="mt-5 text-sm leading-relaxed text-charcoal/80">We work with skilled Indian artisans and traditional craft communities to bring authentic, handmade creations to your home.</p>
              <Link href="/artisans" className="mt-7 inline-flex h-11 items-center gap-2 rounded-[3px] bg-[#0f3d2e] px-6 text-xs font-medium text-ivory transition-colors hover:bg-[#145240]">Know Their Stories <ArrowRight size={14} /></Link>
            </Reveal>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: site.name, url: site.url, description: site.description }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebSite", name: site.name, url: site.url, potentialAction: { "@type": "SearchAction", target: `${site.url}/search?q={search_term_string}`, "query-input": "required name=search_term_string" } }} />
      {t2 ? <><HeroCarousel /><TrustStrip /></> : <Hero banner={hero ?? undefined} />}
      {promo[0] && !t2 && (
        <section className="bg-champagne/25"><Container className="flex flex-wrap items-center justify-between gap-4 py-5"><p className="font-serif text-xl"><strong className="font-medium">{promo[0].title}</strong>{promo[0].subtitle ? <span className="text-charcoal/75"> — {promo[0].subtitle}</span> : null}</p>{promo[0].href && <Link href={promo[0].href} className="link-underline text-xs uppercase tracking-[0.2em]">{promo[0].cta ?? "Explore"}</Link>}</Container></section>
      )}
      {order.map((k, i) => {
        if (!on.has(k) || !blocks[k]) return null;
        const out = [<div key={k}>{blocks[k]}</div>];
        if (k === "bestsellers") out.push(
          <section key="promise" className="pattern-diamond relative mt-24 overflow-hidden bg-burgundy text-ivory lg:mt-32">
            <span aria-hidden className="gold-line absolute inset-x-0 top-0 h-px" /><span aria-hidden className="gold-line absolute inset-x-0 bottom-0 h-px" />
            <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-champagne/10 blur-3xl" />
            <Container className="py-20 lg:py-28">
              <Reveal className="max-w-2xl"><p className="eyebrow flex items-center gap-3 !text-champagne"><span aria-hidden className="h-1.5 w-1.5 rotate-45 bg-champagne" />The Nazi promise</p><h2 className="mt-3 text-[length:var(--text-h2)]">Slow-made, by the hands that know the <em className="gold-text">craft</em>.</h2><GoldRule className="mt-6" width="w-28" delay={0.2} /></Reveal>
              <ul className="mt-14 grid gap-10 md:grid-cols-3">{promises.map(({ icon: Icon, title, body }, j) => (<li key={title}><Reveal delay={j * 0.1}><GoldRule width="w-full" className="mb-8" delay={j * 0.2} /><span className="relative inline-flex h-14 w-14 items-center justify-center"><span aria-hidden className="animate-spin-slow absolute inset-0 rounded-full border border-dashed border-champagne/70" /><Icon size={26} strokeWidth={1.25} className="text-champagne" aria-hidden /></span><h3 className="mt-5 font-serif text-3xl">{title}</h3><p className="mt-3 text-sm leading-relaxed text-ivory/75">{body}</p></Reveal></li>))}</ul>
            </Container>
          </section>);
        void i;
        return out;
      })}
    </>
  );
}
