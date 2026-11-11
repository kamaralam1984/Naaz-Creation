"use client";
import { motion } from "framer-motion";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/cn";

/** Gold hairline that draws itself when scrolled into view, then keeps a slow shimmer running. */
export function GoldRule({ className, width = "w-20", delay = 0, vertical = false }: { className?: string; width?: string; delay?: number; vertical?: boolean }) {
  return (
    <motion.span
      aria-hidden
      className={cn("block", vertical ? "gold-line-v w-px origin-top" : "gold-line h-px origin-left", !vertical && width, className)}
      initial={vertical ? { scaleY: 0 } : { scaleX: 0 }}
      whileInView={vertical ? { scaleY: 1 } : { scaleX: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 1.5, ease, delay }}
    />
  );
}

/** Centered ornament: two gold lines grow out from a turning diamond. */
export function Ornament({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("flex items-center justify-center gap-4", className)}>
      <GoldRule width="w-full max-w-28" className="origin-right" />
      <motion.span className="block h-2 w-2 rotate-45 border border-champagne bg-champagne/30" initial={{ scale: 0, rotate: 0 }} whileInView={{ scale: 1, rotate: 45 }} viewport={{ once: true }} transition={{ duration: 0.9, ease, delay: 0.3 }} />
      <GoldRule width="w-full max-w-28" delay={0.15} />
    </div>
  );
}

/** Four gold lines that draw a frame around a hero, chasing each other clockwise. */
export function GoldFrame({ className }: { className?: string }) {
  const d = (n: number) => ({ duration: 1.6, ease, delay: 0.6 + n * 0.45 });
  return (
    <div aria-hidden className={cn("pointer-events-none absolute", className)}>
      <motion.span className="gold-line absolute left-0 top-0 h-px w-full origin-left" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={d(0)} />
      <motion.span className="gold-line-v absolute right-0 top-0 h-full w-px origin-top" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={d(1)} />
      <motion.span className="gold-line absolute bottom-0 right-0 h-px w-full origin-right" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={d(2)} />
      <motion.span className="gold-line-v absolute bottom-0 left-0 h-full w-px origin-bottom" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={d(3)} />
      {[["left-0 top-0", 0], ["right-0 top-0", 1], ["bottom-0 right-0", 2], ["bottom-0 left-0", 3]].map(([pos, n]) => (
        <span key={String(pos)} className={cn("absolute h-2 w-2", pos, String(pos).includes("right") ? "translate-x-1/2" : "-translate-x-1/2", String(pos).includes("bottom") ? "translate-y-1/2" : "-translate-y-1/2")}>
          <motion.span className="block h-full w-full rotate-45 bg-champagne" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.6, ease, delay: 0.6 + Number(n) * 0.45 }} />
        </span>
      ))}
    </div>
  );
}

/** Soft gold specks drifting in and out — deterministic positions so SSR and client agree. */
export function Sparkles({ count = 16, className }: { count?: number; className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {Array.from({ length: count }, (_, i) => {
        const x = (i * 53 + 11) % 100, y = (i * 37 + 7) % 100, s = 2 + (i % 3);
        return <span key={i} className="animate-twinkle absolute rounded-full bg-[var(--gold-hi)] shadow-[0_0_8px_2px_rgba(243,226,176,0.55)]" style={{ left: `${x}%`, top: `${y}%`, width: s, height: s, animationDelay: `${(i % 7) * 0.7}s`, animationDuration: `${3.2 + (i % 4)}s` }} />;
      })}
    </div>
  );
}

/** Infinite craft ticker with gold diamond separators. */
export function Marquee({ items, className }: { items: string[]; className?: string }) {
  const row = [...items, ...items];
  return (
    <div className={cn("marquee overflow-hidden", className)} aria-hidden>
      <div className="marquee-track items-center">
        {row.map((t, i) => (
          <span key={i} className="flex items-center whitespace-nowrap">
            <span className="px-7 font-serif text-lg italic tracking-wide text-ivory/90 sm:text-xl">{t}</span>
            <span className="h-1.5 w-1.5 rotate-45 bg-champagne" />
          </span>
        ))}
      </div>
    </div>
  );
}
