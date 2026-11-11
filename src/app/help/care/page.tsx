import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { JsonLd, breadcrumbJsonLd, pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Care Guide", description: "How to care for copper, brass, terracotta, wood, jute and handmade paintings so they last for generations.", path: "/help/care" });
const care: [string, string][] = [
  ["Copper", "Wipe with a soft cloth. Restore shine with lemon and salt. Avoid dishwashers and storing acidic drinks for long periods."],
  ["Brass & Dokra", "Dust with a soft cloth. Polish occasionally with a lemon-and-salt paste; keep dry to protect the antique patina."],
  ["Terracotta", "Hand-wash gently with water — no soap on unglazed surfaces. Air-dry fully and avoid sudden temperature changes."],
  ["Wood", "Wipe with a damp cloth and dry immediately. Re-oil with coconut or linseed oil every few months. Keep away from direct heat."],
  ["Jute", "Spot-clean with a damp cloth and air-dry. Do not machine wash. Store somewhere dry."],
  ["Paintings", "Keep out of direct sunlight and moisture. Frame behind UV-protective glass for best longevity."],
];
export default function Care() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Help", path: "/help" }, { name: "Care", path: "/help/care" }])} />
      <PageHero eyebrow="Help" title="Care guide" intro="Handmade pieces reward a little attention. Here's how to keep each material at its best." />
      <Container className="py-16"><dl className="grid gap-8 md:grid-cols-2">{care.map(([m, t]) => <div key={m} className="border-t border-charcoal pt-5"><dt className="font-serif text-3xl">{m}</dt><dd className="mt-3 text-sm leading-relaxed text-charcoal/75">{t}</dd></div>)}</dl></Container>
    </>
  );
}
