import Image from "next/image";
import { cn } from "@/lib/cn";

/** Demo pool: until real photos exist, every empty slot shows one of the shop's own products. */
const DEMO = [
  "golden-tree-of-life-frame", "teal-flower-cushion", "buddha-mosaic-wall-plate", "madhubani-framed-panel", "woven-tree-wall-hanging",
  "paper-rose-basket-bouquet", "red-mirror-mosaic-plate", "madhubani-jute-sling-bag", "pink-satin-round-cushion", "zardozi-charkha-frame",
  "elephant-ear-terracotta-vase", "turquoise-ring-mirror", "sunflower-velvet-cushion", "woven-cottage-wall-hanging", "jute-cone-flower-bouquet",
  "golden-straw-buddha-frame", "silver-pintuck-round-cushion", "madhubani-wedding-painting", "blue-mirror-mosaic-plate", "shell-sun-framed-art",
  "crimson-pintuck-bolster", "woven-village-wall-hanging", "golden-straw-fish-frame",
];
const pick = (s: string) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return DEMO[h % DEMO.length]; };

type Tone = "clay" | "brass" | "wine" | "sand" | "ink";

const tones: Record<Tone, string> = {
  clay: "from-[#c98f6b] to-[#8a4f3a]",
  brass: "from-[#d9bd82] to-[#9a7b45]",
  wine: "from-[color:var(--wine-a)] to-[color:var(--wine-b)]",
  sand: "from-[#efe7d8] to-[#d4c5ab]",
  ink: "from-[#4a443c] to-[#26231f]",
};

/**
 * Stand-in for photography until real product images are supplied.
 * Replace with <Image> and drop the `label` when assets arrive.
 */
export function Placeholder({ tone = "sand", label, className, src, plain = false, pad = "p-[9%]" }: { tone?: Tone; label?: string; className?: string; src?: string; plain?: boolean; pad?: string }) {
  return (
    <div
      role="img"
      aria-label={label ?? "Image placeholder"}
      className={cn("relative h-full w-full overflow-hidden bg-gradient-to-br", tones[tone], className)}
    >
      <svg className="absolute inset-0 h-full w-full opacity-[0.12]" aria-hidden>
        <defs>
          <pattern id={`p-${tone}`} width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M24 4l20 20-20 20L4 24z" fill="none" stroke="#fff" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#p-${tone})`} />
      </svg>
      {!plain && <Image src={src ?? `/catalog/${pick(label ?? tone)}.webp`} alt="" fill sizes="(min-width:1024px) 30vw, 60vw" className={cn("object-contain drop-shadow-[0_14px_22px_rgba(0,0,0,0.3)]", pad)} />}
    </div>
  );
}
