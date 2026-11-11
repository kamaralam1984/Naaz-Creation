"use client";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Sparkles } from "@/components/ui/Gold";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/cn";

type Item = { src: string; left: number; bottom: number; h: number; ar: number; rot?: number; z?: number };
type Slide = { eyebrow: string; title: string[]; body: string; cta: [string, string]; ghost: [string, string]; items: Item[] };

const P = (s: string) => `/catalog/${s}.webp`;
const SLIDES: Slide[] = [
  {
    eyebrow: "Indian Handicrafts", title: ["Handcrafted", "Elegance for", "Your Home"],
    body: "Discover timeless handwoven, hand-painted and artisanal treasures that bring Indian heritage to modern living.",
    cta: ["Shop the Collection", "/shop"], ghost: ["Explore Our Crafts", "/collections"],
    items: [
      { src: P("elephant-ear-terracotta-vase"), left: 2, bottom: 15, h: 84, ar: 0.41, z: 3 },
      { src: P("golden-tree-of-life-frame"), left: 40, bottom: 44, h: 52, ar: 0.82, z: 1 },
      { src: P("turquoise-ring-mirror"), left: 74, bottom: 40, h: 40, ar: 1, z: 1 },
      { src: P("sunflower-velvet-cushion"), left: 20, bottom: 16, h: 42, ar: 1, z: 2 },
      { src: P("red-mirror-mosaic-plate"), left: 57, bottom: 12, h: 38, ar: 1, z: 3 },
    ],
  },
  {
    eyebrow: "Golden Straw & Zardozi", title: ["Gold, Cut by", "Hand &", "Framed for You"],
    body: "Straw-art trees, fish and Buddhas, shell work and zardozi — gold on black and crimson, ready to hang.",
    cta: ["Shop Golden Straw", "/collections/golden-straw"], ghost: ["View Framed Art", "/category/framed-art"],
    items: [
      { src: P("golden-straw-buddha-frame"), left: 2, bottom: 14, h: 78, ar: 0.5, z: 2 },
      { src: P("golden-tree-of-life-frame"), left: 26, bottom: 30, h: 56, ar: 0.82, z: 3 },
      { src: P("golden-straw-fish-frame"), left: 50, bottom: 48, h: 38, ar: 1, z: 1 },
      { src: P("zardozi-charkha-frame"), left: 46, bottom: 13, h: 28, ar: 1.62, z: 4 },
      { src: P("shell-sun-framed-art"), left: 74, bottom: 22, h: 40, ar: 1, z: 2 },
    ],
  },
  {
    eyebrow: "Mirror & Mosaic", title: ["Hundreds of", "Tiny Mirrors,", "Set One by One"],
    body: "Mirror-inlaid plates and ring mirrors that scatter light across a room — made by hand, one ring at a time.",
    cta: ["Shop Mirror Work", "/collections/mirror-mosaic"], ghost: ["Gift Ideas", "/gifting/occasions"],
    items: [
      { src: P("buddha-mosaic-wall-plate"), left: 6, bottom: 22, h: 62, ar: 1, z: 2 },
      { src: P("blue-mirror-mosaic-plate"), left: 40, bottom: 44, h: 46, ar: 1, z: 1 },
      { src: P("red-mirror-mosaic-plate"), left: 46, bottom: 10, h: 40, ar: 1, z: 3 },
      { src: P("turquoise-ring-mirror"), left: 76, bottom: 38, h: 46, ar: 1, z: 2 },
      { src: P("teal-flower-cushion"), left: 74, bottom: 8, h: 26, ar: 1, z: 4 },
    ],
  },
];

export function HeroCarousel() {
  const [i, setI] = useState(0);
  const [hover, setHover] = useState(false);
  const go = useCallback((d: number) => setI((c) => (c + d + SLIDES.length) % SLIDES.length), []);
  useEffect(() => {
    if (hover) return;
    const t = setInterval(() => go(1), 7000);
    return () => clearInterval(t);
  }, [hover, go]);
  const s = SLIDES[i];

  return (
    <section onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} aria-roledescription="carousel" aria-label="Featured collections"
      className="relative isolate overflow-hidden bg-gradient-to-br from-[#0f3d2e] via-[#0b3026] to-[#071f17] text-ivory">
      {/* ambience: warm bokeh, leaf shadows, wooden shelf */}
      <div aria-hidden className="absolute -left-20 top-1/2 -z-10 h-80 w-80 rounded-full bg-amber-500/25 blur-[90px]" />
      <div aria-hidden className="absolute left-[8%] top-[12%] -z-10 h-24 w-24 rounded-full bg-amber-300/20 blur-2xl" />
      <svg aria-hidden viewBox="0 0 400 400" className="absolute -right-10 -top-10 -z-10 h-[75%] w-auto text-[#0a2a1f] opacity-90">
        {[[300, 80, 0], [340, 140, 30], [250, 140, -35], [370, 40, 60], [290, 20, -70], [330, 220, 20]].map(([x, y, r], k) => (
          <path key={k} transform={`translate(${x} ${y}) rotate(${r})`} d="M0 0C40-30 90-10 110 50 60 60 20 50 0 0Z" fill="currentColor" />
        ))}
      </svg>
      <Sparkles count={14} className="-z-[5]" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-[4] h-[13%] bg-gradient-to-b from-[#6b4527] via-[#4a2d18] to-[#2a190c] shadow-[inset_0_2px_0_rgba(243,226,176,0.25)]" />

      <div className="relative mx-auto flex min-h-[480px] max-w-[1440px] flex-col justify-center px-6 pb-20 pt-12 sm:px-10 lg:min-h-[560px] lg:px-16">
        <AnimatePresence mode="wait">
          <motion.div key={i} initial="hidden" animate="show" exit="out" aria-live="polite" className="relative z-10 max-w-md lg:max-w-lg">
            <motion.p variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 }, out: { opacity: 0 } }} className="flex items-center gap-3 text-[0.72rem] font-medium uppercase tracking-[0.42em] text-ivory/90">
              {s.eyebrow}
            </motion.p>
            <motion.p variants={{ hidden: { opacity: 0 }, show: { opacity: 1 }, out: { opacity: 0 } }} className="gold-text mt-4 font-serif text-xl uppercase tracking-[0.3em]">Naaz Creation</motion.p>
            <h1 className="mt-4 font-serif text-[clamp(2.6rem,5.2vw,4.6rem)] font-normal italic leading-[1.02] text-[#f6ecd3]">
              {s.title.map((l, k) => (
                <motion.span key={l} className="block" variants={{ hidden: { opacity: 0, y: 30, filter: "blur(6px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.9, ease, delay: 0.1 + k * 0.12 } }, out: { opacity: 0, transition: { duration: 0.25 } } }}>{l}</motion.span>
              ))}
            </h1>
            <motion.p variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { delay: 0.5, duration: 0.8 } }, out: { opacity: 0 } }} className="mt-5 max-w-sm text-[0.95rem] leading-relaxed text-ivory/85">{s.body}</motion.p>
            <motion.div variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { delay: 0.65, duration: 0.8 } }, out: { opacity: 0 } }} className="mt-7 flex flex-wrap gap-3">
              <Button href={s.cta[1]} variant="gold" className="!h-11 rounded-[3px] !px-6 !text-[0.75rem] !tracking-wide !normal-case">{s.cta[0]} <ArrowRight size={15} /></Button>
              <Button href={s.ghost[1]} variant="outline" className="!h-11 rounded-[3px] !border-ivory/80 !px-6 !text-[0.75rem] !tracking-wide !normal-case !text-ivory hover:!bg-ivory hover:!text-charcoal">{s.ghost[0]}</Button>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* product still life */}
        <div aria-hidden className="pointer-events-none relative mt-4 h-64 w-full sm:h-72 lg:absolute lg:inset-y-0 lg:right-0 lg:mt-0 lg:h-auto lg:w-[58%]">
          <AnimatePresence mode="wait">
            <motion.div key={i} className="absolute inset-0" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.9, ease }}>
              {s.items.map((it, k) => (
                <div key={it.src} className="animate-float absolute" style={{ left: `${it.left}%`, bottom: `${it.bottom}%`, height: `${it.h}%`, aspectRatio: it.ar, zIndex: it.z, rotate: it.rot ? `${it.rot}deg` : undefined, animationDelay: `${-k * 1.1}s`, animationDuration: `${7 + (k % 3)}s` }}>
                  <Image src={it.src} alt="" fill sizes="30vw" priority={k < 3} className="object-contain drop-shadow-[0_22px_28px_rgba(0,0,0,0.55)]" />
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <button onClick={() => go(-1)} aria-label="Previous slide" className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-charcoal shadow-lg transition-transform hover:scale-110 sm:left-5"><ChevronLeft size={20} /></button>
      <button onClick={() => go(1)} aria-label="Next slide" className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-charcoal shadow-lg transition-transform hover:scale-110 sm:right-5"><ChevronRight size={20} /></button>
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {SLIDES.map((_, k) => (
          <button key={k} onClick={() => setI(k)} aria-label={`Go to slide ${k + 1}`} aria-current={k === i}
            className={cn("h-2 rounded-full transition-all duration-500", k === i ? "w-6 bg-champagne" : "w-2 bg-ivory/70 hover:bg-ivory")} />
        ))}
      </div>
    </section>
  );
}
