/* eslint-disable react/no-unescaped-entities */
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { PageHero } from "@/components/layout/PageHero";
import { Placeholder } from "@/components/home/Placeholder";
import { JsonLd, breadcrumbJsonLd, organizationJsonLd, pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Our Story", description: "Nazi Creation brings the work of India's master artisans — Dokra casters, copper smiths, potters and painters — to homes around the world.", path: "/about" });

const values = [
  ["Made by hand", "No moulds, no assembly lines. Every piece is shaped, cast, carved or painted by one pair of hands."],
  ["Fair to the maker", "We pay artisans the price they ask and commission ahead, so a craft can be a career, not a compromise."],
  ["Made to last", "Natural materials and slow methods mean our pieces age beautifully and can be passed down."],
  ["Honest about origin", "Every product page names its craft, its region and, wherever possible, its maker."],
];
const steps = [["Sourced", "We travel to workshops across Bihar, Bengal, Rajasthan and Uttar Pradesh and commission pieces directly."], ["Crafted", "Artisans work at their own pace — a copper bottle takes two days, a Dokra tree a week."], ["Checked", "Each piece is inspected, finished and photographed by our team in Jaipur."], ["Delivered", "Packed in recycled, plastic-free materials and shipped across India and abroad."]];

export default function About() {
  return (
    <>
      <JsonLd data={organizationJsonLd()} /><JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Our Story", path: "/about" }])} />
      <PageHero eyebrow="Our story" title="A house for the people who still make things by hand." intro="Karigar means craftsperson. We began with one question: why is the best of Indian craft so hard to find, and so rarely credited to the people behind it?" />
      <Container className="grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-28">
        <Reveal><div className="aspect-[4/5]"><Placeholder tone="wine" label="Artisans at work in a workshop" /></div></Reveal>
        <div className="space-y-5 leading-relaxed text-charcoal/80">
          <Reveal><h2 className="font-serif text-4xl text-charcoal">From the workshop to your table</h2></Reveal>
          <Reveal delay={0.1}><p>India's craft traditions are thousands of years old — lost-wax casting in Bengal, Madhubani painting in Bihar, hammered copper in Jaipur. Yet the people carrying them forward often sell through layers of middlemen and see little of the final price.</p></Reveal>
          <Reveal delay={0.2}><p>Nazi Creation works directly with workshops and cooperatives, tells their stories on every product page, and ships their work around the world, so that the hand that made it is the first name you meet.</p></Reveal>
          <Reveal delay={0.3}><Button href="/artisans" variant="outline">Meet the artisans</Button></Reveal>
        </div>
      </Container>
      <section className="bg-burgundy text-ivory"><Container className="py-20 lg:py-28">
        <Reveal><p className="eyebrow !text-champagne">What we stand for</p><h2 className="mt-3 max-w-2xl text-[length:var(--text-h2)]">Four promises behind every piece</h2></Reveal>
        <ul className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">{values.map(([t, b], i) => <li key={t}><Reveal delay={i * 0.08}><h3 className="font-serif text-3xl">{t}</h3><p className="mt-3 text-sm leading-relaxed text-ivory/75">{b}</p></Reveal></li>)}</ul>
      </Container></section>
      <Container className="py-20 lg:py-28">
        <Reveal><p className="eyebrow">How it comes to you</p><h2 className="mt-3 text-[length:var(--text-h2)]">Our process</h2></Reveal>
        <ol className="mt-12 grid gap-8 md:grid-cols-4">{steps.map(([t, b], i) => <li key={t} className="border-t border-charcoal pt-5"><Reveal delay={i * 0.08}><p className="font-serif text-5xl text-champagne-deep">0{i + 1}</p><h3 className="mt-3 font-serif text-2xl">{t}</h3><p className="mt-2 text-sm leading-relaxed text-charcoal/75">{b}</p></Reveal></li>)}</ol>
        <div className="mt-16 flex flex-wrap gap-4"><Button href="/shop" size="lg">Shop the collection</Button><Button href="/contact" variant="outline" size="lg">Get in touch</Button></div>
      </Container>
    </>
  );
}
