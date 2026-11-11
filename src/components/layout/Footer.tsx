import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/Container";
import { site } from "@/lib/site";
import { Ornament } from "@/components/ui/Gold";
import { Year } from "@/components/layout/Year";
import { CurrencySwitch } from "@/components/layout/CurrencySwitch";

const cols = [
  { title: "Shop", links: [["All Products", "/shop"], ["Best Sellers", "/best-sellers"], ["New Arrivals", "/new-arrivals"], ["Sale", "/sale"]] },
  { title: "Gifting", links: [["Corporate Gifting", "/gifting/corporate"], ["Custom Hampers", "/gifting/hampers"], ["Gift Cards", "/gift-cards"]] },
  { title: "Help", links: [["Shipping & Delivery", "/help/shipping"], ["Returns & Refunds", "/help/returns"], ["Track Order", "/account/orders"], ["Contact", "/contact"]] },
  { title: "House", links: [["Our Story", "/about"], ["Artisans", "/artisans"], ["Care Guide", "/help/care"]] },
];

export function Footer({ social, whatsapp }: { social: { instagram: string; facebook: string; pinterest: string; youtube: string }; whatsapp: string }) {
  return (
    <footer className="relative mt-32 overflow-hidden bg-[color:var(--footer-bg)] text-ivory">
      <span aria-hidden className="gold-line absolute inset-x-0 top-0 h-px" />
      <div aria-hidden className="pattern-diamond pointer-events-none absolute inset-0 opacity-50" />
      <Container className="relative pt-16"><Ornament /></Container>
      <Container className="relative grid gap-14 py-20 lg:grid-cols-[1.4fr_2.6fr]">
        <div>
          <Logo tone="light" />
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-ivory/70">{site.tagline}. Every piece carries the signature of the hands that made it.</p>
          <ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs uppercase tracking-[0.16em] text-ivory/80">
            {social.instagram && <li><a href={social.instagram} rel="noopener noreferrer" target="_blank" className="link-underline">Instagram</a></li>}
            {social.facebook && <li><a href={social.facebook} rel="noopener noreferrer" target="_blank" className="link-underline">Facebook</a></li>}
            {social.pinterest && <li><a href={social.pinterest} rel="noopener noreferrer" target="_blank" className="link-underline">Pinterest</a></li>}
            {social.youtube && <li><a href={social.youtube} rel="noopener noreferrer" target="_blank" className="link-underline">YouTube</a></li>}
            {whatsapp && <li><a href={`https://wa.me/${whatsapp}`} rel="noopener noreferrer" target="_blank" className="link-underline">WhatsApp</a></li>}
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          {cols.map((c) => (
            <div key={c.title}>
              <p className="eyebrow !text-champagne">{c.title}</p>
              <ul className="mt-4 space-y-0.5 text-sm">
                {c.links.map(([l, h]) => <li key={h}><Link href={h} className="inline-block py-1.5 text-ivory/80 transition-all duration-300 hover:translate-x-1 hover:text-[var(--gold-hi)]">{l}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
      </Container>
      <p aria-hidden className="gold-text pointer-events-none select-none text-center font-serif text-[clamp(3rem,13vw,11rem)] uppercase leading-none tracking-[0.08em] opacity-[0.18]">Nazi Creation</p>
      <div className="relative border-t border-champagne/25">
        <Container className="flex flex-col gap-3 py-6 text-xs text-ivory/60 sm:flex-row sm:justify-between sm:pr-32">
          <p>© <Year /> {site.name}. All rights reserved.</p>
          <div className="flex items-center gap-6"><a href="#top" className="link-underline inline-block py-2 uppercase tracking-[0.16em] text-champagne">Back to top ↑</a><CurrencySwitch /><Link href="/legal/privacy" className="inline-block py-2">Privacy</Link><Link href="/legal/terms" className="inline-block py-2">Terms</Link></div>
        </Container>
      </div>
    </footer>
  );
}
