import { cn } from "@/lib/cn";

const SKINS = [
  "bg-gradient-to-br from-[color:var(--wine-a)] to-[color:var(--wine-b)] text-ivory",
  "bg-gradient-to-br from-[#3a342c] to-[#1c1915] text-ivory",
  "bg-gradient-to-br from-[#e9d19a] to-[#b8934f] text-charcoal",
];

/** The Nazi Creation gift card. `skin` picks one of three looks (used for the gallery views). */
export function GiftCardArt({ amount, skin = 0, className, label = "Gift card" }: { amount?: React.ReactNode; skin?: number; className?: string; label?: string }) {
  const light = skin % 3 === 2;
  return (
    <div role="img" aria-label="Nazi Creation gift card" className={cn("gold-corners group relative aspect-[16/10] w-full overflow-hidden rounded-lg shadow-[var(--shadow-lift)]", SKINS[skin % 3], className)}>
      <div aria-hidden className="pattern-diamond absolute inset-0 opacity-80" />
      <div aria-hidden className="absolute -right-10 -top-16 h-64 w-64 rounded-full bg-champagne/25 blur-3xl" />
      <div aria-hidden className="animate-spin-slow absolute -bottom-24 -right-24 h-72 w-72 rounded-full border border-dashed border-champagne/50" />
      <span aria-hidden className="gold-line absolute inset-x-0 top-0 h-px" /><span aria-hidden className="gold-line absolute inset-x-0 bottom-0 h-px" />
      <div className="absolute inset-0 flex flex-col justify-between p-[7%]">
        <div className="flex items-start justify-between">
          <p className={cn("font-serif text-[clamp(1rem,5vw,1.6rem)] uppercase leading-tight tracking-[0.2em]", light ? "text-[#4a3516]" : "gold-text")}>Nazi Creation</p>
          <span aria-hidden className="h-7 w-10 rounded-[4px] bg-gradient-to-br from-[#f3e2b0] to-[#b8934f] opacity-90" />
        </div>
        <div>
          <p className={cn("eyebrow", light ? "!text-[#4a3516]" : "!text-champagne")}>{label}</p>
          {amount !== undefined && <p className="mt-1 font-serif text-[clamp(2.2rem,11vw,3.75rem)] leading-none">{amount}</p>}
        </div>
      </div>
    </div>
  );
}
