"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play, X, ZoomIn } from "lucide-react";
import { ProductArt } from "@/components/product/ProductArt";
import { cn } from "@/lib/cn";
import type { Product } from "@/server/types";

type Slide = { kind: "image"; src: string } | { kind: "art"; i: number } | { kind: "video"; src: string };

export function ProductGallery({ p }: { p: Product }) {
  const slides: Slide[] = [
    ...(p.images.length ? p.images.map((src) => ({ kind: "image" as const, src })) : [0, 1, 2].map((i) => ({ kind: "art" as const, i }))),
    ...(p.video_url ? [{ kind: "video" as const, src: p.video_url }] : []),
  ];
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [box, setBox] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const s = slides[i];
  const go = (d: number) => setI((c) => (c + d + slides.length) % slides.length);

  useEffect(() => {
    if (!box) return;
    const f = (e: KeyboardEvent) => { if (e.key === "Escape") setBox(false); if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); };
    window.addEventListener("keydown", f); document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", f); document.body.style.overflow = ""; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box]);

  const render = (sl: Slide, sizes: string, priority = false) =>
    sl.kind === "video" ? <video src={sl.src} controls playsInline preload="metadata" className="h-full w-full bg-charcoal object-contain" />
    : sl.kind === "image" ? <Image src={sl.src} alt={p.name} fill sizes={sizes} priority={priority} className="object-contain" />
    : <ProductArt tone={sl.i % 2 ? p.alt_tone : p.tone} alt={sl.i % 2 === 1} kind={p.kind === "giftcard" ? "default" : p.category_slug ?? "default"} label={`${p.name} — view ${sl.i + 1}`} />;

  const thumb = (sl: Slide, k: number) => (
    <button key={k} onClick={() => setI(k)} aria-label={`Show ${sl.kind === "video" ? "video" : `image ${k + 1}`}`} aria-current={k === i}
      className={cn("relative aspect-square w-16 shrink-0 overflow-hidden border-2 transition-colors lg:w-full", k === i ? "border-charcoal" : "border-transparent opacity-70 hover:opacity-100")}>
      {sl.kind === "video" ? <span className="flex h-full w-full items-center justify-center bg-charcoal text-ivory"><Play size={18} /></span> : render(sl, "100px")}
    </button>
  );

  return (
    <div className="grid gap-3 lg:grid-cols-[80px_1fr]">
      <div className="order-2 flex gap-2 overflow-x-auto lg:order-1 lg:flex-col lg:overflow-visible">{slides.map(thumb)}</div>
      <div className="order-1 lg:order-2">
        <div ref={ref} className={cn("group relative aspect-[4/5] overflow-hidden bg-beige", s.kind !== "video" && "cursor-zoom-in")}
          onMouseMove={(e) => { if (s.kind === "video" || !ref.current) return; const r = ref.current.getBoundingClientRect(); setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }); }}
          onMouseLeave={() => setZoom(null)} onClick={() => s.kind !== "video" && setBox(true)}>
          <div key={i} className="absolute inset-0 animate-[fadeIn_.5s_var(--ease-luxe)] transition-transform duration-200 will-change-transform max-lg:!transform-none"
            style={zoom ? { transform: "scale(1.9)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}>{render(s, "(min-width:1024px) 45vw, 100vw", true)}</div>
          {s.kind !== "video" && <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1 bg-ivory/90 px-2.5 py-1.5 text-[0.65rem] uppercase tracking-[0.16em]"><ZoomIn size={13} /> Zoom</span>}
          {slides.length > 1 && (<>
            <button aria-label="Previous image" onClick={(e) => { e.stopPropagation(); go(-1); }} className="absolute left-2 top-1/2 -translate-y-1/2 bg-ivory/85 p-2 opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100 max-lg:opacity-100"><ChevronLeft size={18} /></button>
            <button aria-label="Next image" onClick={(e) => { e.stopPropagation(); go(1); }} className="absolute right-2 top-1/2 -translate-y-1/2 bg-ivory/85 p-2 opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100 max-lg:opacity-100"><ChevronRight size={18} /></button>
          </>)}
        </div>
      </div>
      {box && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-charcoal/95 p-4" role="dialog" aria-modal="true" aria-label="Image viewer" onClick={() => setBox(false)}>
          <button aria-label="Close viewer" className="absolute right-4 top-4 p-2 text-ivory"><X size={26} /></button>
          <button aria-label="Previous image" onClick={(e) => { e.stopPropagation(); go(-1); }} className="absolute left-3 p-3 text-ivory"><ChevronLeft size={30} /></button>
          <div className="relative h-[85vh] w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>{render(s, "90vw")}</div>
          <button aria-label="Next image" onClick={(e) => { e.stopPropagation(); go(1); }} className="absolute right-3 p-3 text-ivory"><ChevronRight size={30} /></button>
        </div>
      )}
    </div>
  );
}
