import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Help Centre", description: "Shipping, returns, product care and contact information for Nazi Creation.", path: "/help" });
const links = [["Shipping & delivery", "/help/shipping", "Rates, timelines and international orders."], ["Returns & refunds", "/help/returns", "How to return a piece and when refunds arrive."], ["Care guide", "/help/care", "Keep every material looking its best."], ["Contact us", "/contact", "We reply within one working day."]];
export default function Help() {
  return (<><PageHero eyebrow="Help" title="How can we help?" /><Container className="py-16"><ul className="grid gap-5 sm:grid-cols-2">{links.map(([t, h, b]) => <li key={h}><Link href={h} className="block border border-charcoal/15 bg-beige/40 p-7 transition-shadow hover:shadow-[var(--shadow-lift)]"><h2 className="font-serif text-3xl">{t}</h2><p className="mt-2 text-sm text-charcoal/70">{b}</p></Link></li>)}</ul></Container></>);
}
