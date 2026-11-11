import Link from "next/link";
import { cn } from "@/lib/cn";

/** Original wordmark: a monogram in a gold arch (a nod to the artisan's kiln/doorway). */
export function Logo({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" | "current" }) {
  const ink = tone === "dark" ? "text-charcoal" : tone === "light" ? "text-ivory" : "";
  return (
    <Link href="/" aria-label="Nazi Creation — home" className={cn("inline-flex items-center gap-3", ink, className)}>
      <svg width="32" height="38" viewBox="0 0 32 38" fill="none" aria-hidden>
        <path d="M2 36V16C2 8 8 2 16 2s14 6 14 14v20" stroke="var(--champagne)" strokeWidth="1.5" />
        <path d="M11 27V12l10 15V12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="font-serif text-2xl tracking-[0.08em] uppercase">Nazi</span>
        <span className={cn("logo-sub mt-1 text-[0.7rem] font-extrabold tracking-[0.34em] uppercase", tone === "light" && "logo-sub-bright", tone === "dark" && "logo-sub-dark")}>Creation</span>
      </span>
    </Link>
  );
}
