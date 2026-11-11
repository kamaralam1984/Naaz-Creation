import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = { title: "Design System", robots: { index: false } };

const colors = [
  ["Ivory", "#F8F5EF", "bg-ivory"], ["Champagne Gold", "#C4A46A", "bg-champagne"], ["Deep Burgundy", "#572E35", "bg-burgundy"],
  ["Charcoal", "#26231F", "bg-charcoal"], ["Warm Beige", "#EAE2D5", "bg-beige"],
];

export default function DesignSystem() {
  return (
    <Container className="space-y-24 py-20">
      <Reveal>
        <p className="eyebrow">Design foundation</p>
        <h1 className="mt-4 text-[length:var(--text-display)]">Nazi <em className="text-burgundy">Creation</em></h1>
        <p className="mt-6 max-w-xl text-charcoal/70">Dark text on warm backgrounds. Serif for voice, sans for clarity. Generous whitespace, soft warm shadows, no glow.</p>
      </Reveal>

      <section>
        <p className="eyebrow mb-6">Colour</p>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {colors.map(([n, h, c]) => (
            <div key={n}><div className={`${c} h-28 border border-charcoal/10`} /><p className="mt-3 text-sm font-medium">{n}</p><p className="text-xs text-charcoal/60">{h}</p></div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <p className="eyebrow">Typography</p>
        <p className="font-serif text-[length:var(--text-h1)] leading-none">Editorial headline</p>
        <p className="font-serif text-[length:var(--text-h2)]">Section heading in Cormorant</p>
        <p className="font-serif text-[length:var(--text-h3)]">Card heading</p>
        <p className="max-w-prose">Body copy is set in Inter at a comfortable measure with relaxed leading, so product stories read like a magazine.</p>
      </section>

      <section>
        <p className="eyebrow mb-6">Buttons & badges</p>
        <div className="flex flex-wrap gap-4">
          <Button>Shop Now</Button><Button variant="gold">Add to Cart</Button><Button variant="outline">Explore</Button><Button variant="ghost">Learn more</Button><Button disabled>Disabled</Button>
        </div>
        <div className="mt-6 flex flex-wrap gap-3"><Badge>Best Seller</Badge><Badge tone="burgundy">New</Badge><Badge tone="charcoal">-20%</Badge><Badge tone="outline">Handmade</Badge></div>
      </section>

      <section>
        <p className="eyebrow mb-6">Cards</p>
        <div className="grid gap-6 md:grid-cols-3">
          {["Copper", "Terracotta", "Dokra"].map((t) => (
            <Card key={t} className="p-8"><p className="eyebrow">Craft</p><p className="mt-3 font-serif text-3xl">{t}</p><p className="mt-3 text-sm text-charcoal/70">Hover for the lift shadow.</p></Card>
          ))}
        </div>
      </section>

      <section>
        <p className="eyebrow mb-6">Motion standards</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-charcoal/80">
          <li>Easing: cubic-bezier(0.22, 1, 0.36, 1) everywhere.</li>
          <li>Durations: 200ms micro, 400ms hover, 900ms reveal.</li>
          <li>Reveal: 28px rise + fade, once, 80px before viewport.</li>
          <li>Stagger: 100ms. Image hover zoom 1.06 over 1.2s.</li>
          <li>Page transition: 12px rise + fade, 600ms. Honors prefers-reduced-motion.</li>
        </ul>
      </section>
    </Container>
  );
}
