"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Palette } from "lucide-react";
import { cn } from "@/lib/cn";

const THEMES = [{ id: "1", label: "Theme 1" }, { id: "2", label: "Theme 2" }] as const;

/** Floating switch: flip the whole storefront between Theme 1 and Theme 2 at any time (remembered for a year). */
function applyTheme(id: "1" | "2") {
  document.cookie = `naaz_theme=${id}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.dataset.theme = id;
}

export function ThemeSwitcher({ theme }: { theme: "1" | "2" }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  function pick(id: "1" | "2") {
    if (id === theme) return;
    applyTheme(id);
    setOpen(false);
    start(() => router.refresh());
  }
  return (
    <div data-floating className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-3 z-[60] lg:bottom-5 lg:left-5">
      {/* phones: a single round button that opens the two choices */}
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Choose website theme"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-champagne/50 bg-charcoal/90 text-champagne shadow-[var(--shadow-lift)] backdrop-blur lg:hidden"><Palette size={17} /></button>
      <div role="group" aria-label="Choose website theme"
        className={cn("items-center gap-1 rounded-full border border-champagne/50 bg-charcoal/90 p-1 pl-3 text-ivory shadow-[var(--shadow-lift)] backdrop-blur max-lg:absolute max-lg:bottom-12 max-lg:left-0", open ? "flex" : "max-lg:hidden lg:flex", pending && "opacity-70")}>
        <Palette size={15} className="mr-1 text-champagne" aria-hidden />
        {THEMES.map((t) => (
          <button key={t.id} onClick={() => pick(t.id)} aria-pressed={theme === t.id}
            className={cn("whitespace-nowrap rounded-full px-3 py-2 text-[0.68rem] font-medium uppercase tracking-[0.14em] transition-colors", theme === t.id ? "bg-champagne text-charcoal" : "hover:text-champagne")}>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
