"use client";
import Link from "next/link";
import { useState } from "react";
import { Truck, X } from "lucide-react";
import { Container } from "@/components/ui/Container";

export function AnnouncementBar({ text }: { text: string }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="relative bg-charcoal text-ivory [[data-theme='2']_&]:bg-[#0a2c21]">
      {/* Theme 1 */}
      <Container className="only-t1 relative flex h-10 items-center justify-center pr-8">
        <p className="text-center text-[0.7rem] uppercase tracking-[0.18em] sm:text-xs">
          {text} · <Link href="/shop" className="link-underline text-champagne">Shop now</Link>
        </p>
      </Container>
      {/* Theme 2 */}
      <Container className="only-t2 relative flex min-h-10 items-center justify-center gap-3 py-1.5 pr-8 sm:gap-5">
        <p className="flex items-center gap-2 text-center text-[0.68rem] tracking-wide sm:text-xs">
          <Truck size={15} className="hidden shrink-0 text-champagne sm:block" aria-hidden /> {text}
        </p>
        <span aria-hidden className="hidden h-4 w-px bg-champagne/40 md:block" />
        <p className="hidden text-xs tracking-wide md:block">Festive Collection Now Live – Up to 30% Off</p>
        <Link href="/sale" className="shrink-0 rounded-[3px] bg-champagne px-3 py-1.5 text-[0.7rem] font-semibold text-charcoal transition-colors hover:bg-[var(--gold-hi)]">Shop Now →</Link>
      </Container>
      <button onClick={() => setOpen(false)} aria-label="Dismiss announcement" className="absolute right-1 top-1/2 -translate-y-1/2 p-3 sm:right-6"><X size={14} /></button>
      <span aria-hidden className="gold-line absolute inset-x-0 bottom-0 h-px" />
    </div>
  );
}
