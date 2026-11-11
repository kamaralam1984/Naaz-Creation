"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
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
  function pick(id: "1" | "2") {
    if (id === theme) return;
    applyTheme(id);
    start(() => router.refresh());
  }
  return (
    <div role="group" aria-label="Choose website theme" className={cn("fixed bottom-3 left-3 z-[60] flex origin-bottom-left scale-[0.85] sm:bottom-5 sm:left-5 sm:scale-100 flex items-center gap-1 rounded-full border border-champagne/50 bg-charcoal/90 p-1 pl-3 text-ivory shadow-[var(--shadow-lift)] backdrop-blur", pending && "opacity-70")}>
      <Palette size={15} className="mr-1 text-champagne" aria-hidden />
      {THEMES.map((t) => (
        <button key={t.id} onClick={() => pick(t.id)} aria-pressed={theme === t.id}
          className={cn("rounded-full px-3 py-1.5 text-[0.68rem] font-medium uppercase tracking-[0.14em] transition-colors", theme === t.id ? "bg-champagne text-charcoal" : "hover:text-champagne")}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
