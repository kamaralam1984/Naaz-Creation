import { cn } from "@/lib/cn";
type Tone = "gold" | "burgundy" | "charcoal" | "outline";
const tones: Record<Tone, string> = {
  gold: "bg-champagne text-charcoal",
  burgundy: "bg-burgundy text-ivory",
  charcoal: "bg-charcoal text-ivory",
  outline: "border border-charcoal/30 text-charcoal",
};
export function Badge({ tone = "gold", className, ...p }: { tone?: Tone } & React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("inline-block px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-[0.18em]", tones[tone], className)} {...p} />;
}
