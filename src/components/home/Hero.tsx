"use client";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Placeholder } from "@/components/home/Placeholder";
import Image from "next/image";
import { GoldFrame, GoldRule, Marquee, Sparkles } from "@/components/ui/Gold";
import { ease, stagger, fadeUp } from "@/lib/motion";
import { site } from "@/lib/site";

/**
 * Cinematic hero. The background layer is a placeholder gradient — swap <Placeholder> for a full-bleed
 * <Image priority fill className="object-cover"> once lifestyle photography is supplied.
 */
export function Hero({ banner }: { banner?: { title: string; subtitle: string | null; href: string | null; cta: string | null } }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "18%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.08]);

  return (
    <section ref={ref} className="relative isolate flex min-h-[78vh] items-end overflow-hidden bg-charcoal text-ivory lg:min-h-[88vh]">
      <motion.div style={{ y, scale }} className="absolute inset-0 -z-10 will-change-transform">
        <motion.div className="h-full" initial={{ scale: 1.12 }} animate={{ scale: 1 }} transition={{ duration: 2.2, ease }}>
          <Placeholder tone="wine" label="Lifestyle photograph of handcrafted décor" plain />
        </motion.div>
      </motion.div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-charcoal/80 via-charcoal/30 to-transparent" aria-hidden />
      <div className="pattern-diamond absolute inset-0 -z-[9] opacity-60" aria-hidden />
      <div className="absolute -left-40 top-1/3 -z-[8] h-96 w-96 rounded-full bg-champagne/15 blur-3xl" aria-hidden />
      <Sparkles count={22} className="-z-[6]" />
      <GoldFrame className="inset-3 -z-[4] sm:inset-5 lg:inset-8 lg:bottom-24" />

      {/* Composed still-life from the shop's own product photography */}
      <motion.div style={{ y: useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "-8%"]) }} className="pointer-events-none absolute inset-y-0 right-0 -z-[5] hidden w-[46%] items-center justify-center lg:flex" aria-hidden>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.4, ease, delay: 0.4 }} className="relative aspect-square w-full max-w-xl">
          <div className="animate-float absolute left-[4%] top-[8%] aspect-[4/5] w-[46%] drop-shadow-[0_18px_30px_rgba(0,0,0,0.45)]" style={{ animationDelay: "-1.3s", animationDuration: "7s" }}><Image src="/catalog/golden-tree-of-life-frame.webp" alt="" fill sizes="25vw" priority className="object-contain" /></div>
          <div className="animate-float absolute right-[4%] top-[10%] aspect-square w-[40%] drop-shadow-[0_18px_30px_rgba(0,0,0,0.45)]" style={{ animationDelay: "-2.6s", animationDuration: "8s" }}><Image src="/catalog/teal-flower-cushion.webp" alt="" fill sizes="20vw" priority className="object-contain" /></div>
          <div className="animate-float absolute bottom-[2%] left-[22%] aspect-square w-[34%] drop-shadow-[0_18px_30px_rgba(0,0,0,0.45)]" style={{ animationDelay: "-3.9s", animationDuration: "9s" }}><Image src="/catalog/buddha-mosaic-wall-plate.webp" alt="" fill sizes="18vw" className="object-contain" /></div>
          <div className="animate-float absolute right-[22%] bottom-[2%] aspect-[2/5] w-[17%] drop-shadow-[0_18px_30px_rgba(0,0,0,0.45)]" style={{ animationDelay: "-5.2s", animationDuration: "10s" }}><Image src="/catalog/elephant-ear-terracotta-vase.webp" alt="" fill sizes="14vw" className="object-contain" /></div>
        </motion.div>
      </motion.div>

      <Container className="pb-28 pt-40 lg:pb-40">
        <motion.div variants={stagger(0.14, 0.2)} initial="hidden" animate="show" className="max-w-4xl">
          <motion.div variants={fadeUp} className="flex items-center gap-4"><GoldRule width="w-14" delay={0.5} /><p className="eyebrow !text-champagne">Handcrafted in India</p></motion.div>
          <motion.p variants={fadeUp} aria-hidden className="mt-4 font-serif uppercase leading-[0.95] tracking-[0.06em] text-ivory text-[clamp(3rem,7.4vw,7rem)]">
            Nazi <span className="gold-text block">Creation</span>
          </motion.p>
          <motion.h1 variants={fadeUp} className="mt-8 text-[length:var(--text-h2)]">
            <span className="sr-only">{site.name} — </span>
            {banner ? banner.title : <>Objects with <em className="text-champagne">a maker&apos;s</em> signature.</>}
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-7 max-w-md text-base leading-relaxed text-ivory/85">{banner?.subtitle ?? site.description}</motion.p>
          <motion.div variants={fadeUp} className="mt-10 flex flex-wrap gap-4">
            <Button href={banner?.href ?? "/shop"} variant="gold" size="lg">{banner?.cta ?? "Shop now"}</Button>
            <Button href="/about" variant="outline" size="lg" className="!border-ivory !text-ivory hover:!bg-ivory hover:!text-charcoal">Our story</Button>
          </motion.div>
        </motion.div>
      </Container>
      <div className="absolute inset-x-0 bottom-0 border-t border-champagne/30 bg-charcoal/55 py-3.5 backdrop-blur-sm">
        <Marquee items={["Madhubani painting", "Golden straw art", "Zardozi embroidery", "Mirror & mosaic work", "Hand smocking", "Handloom weaving", "Carved terracotta", "Burlap flower craft"]} />
      </div>
    </section>
  );
}
