import { useId } from "react";
import { cn } from "@/lib/cn";

type Tone = "clay" | "brass" | "wine" | "sand" | "ink";
const T: Record<Tone, { bg1: string; bg2: string; o1: string; o2: string }> = {
  clay: { bg1: "#f2e0d0", bg2: "#dcb89c", o1: "#bd7152", o2: "#7a3f2c" },
  brass: { bg1: "#f5ebd0", bg2: "#e2cd9b", o1: "#d1aa61", o2: "#8c6a2c" },
  wine: { bg1: "#efd9db", bg2: "#d2a7ac", o1: "#8a4652", o2: "#46232a" },
  sand: { bg1: "#f6f1e6", bg2: "#e5dac5", o1: "#cdb98f", o2: "#968462" },
  ink: { bg1: "#dcd7ce", bg2: "#b8b1a4", o1: "#5a5349", o2: "#26231f" },
};

/** Studio-style illustration of each craft, used until real photography is uploaded. */
function Shape({ kind, fill, hi }: { kind: string; fill: string; hi: string }) {
  switch (kind) {
    case "copper":
      return (<g><rect x="42" y="18" width="16" height="12" rx="3" fill={fill} /><path d="M44 30h12v10c10 6 14 18 14 34v28c0 6-5 10-10 10H40c-5 0-10-4-10-10V74c0-16 4-28 14-34z" fill={fill} /><path d="M38 60c0 10 0 28 3 38" stroke={hi} strokeWidth="2.2" strokeLinecap="round" opacity=".5" fill="none" />{[52, 64, 76, 88].map((y) => <path key={y} d={`M33 ${y}q17 4 34 0`} stroke={hi} strokeWidth=".8" opacity=".35" fill="none" />)}</g>);
    case "dokra-brass":
      return (<g><circle cx="50" cy="32" r="9" fill={fill} /><path d="M40 44h20l6 26-8 3 6 26H36l6-26-8-3z" fill={fill} /><rect x="38" y="98" width="24" height="6" rx="2" fill={fill} />{[50, 60, 70, 80].map((y) => <path key={y} d={`M38 ${y}q12 3 24 0`} stroke={hi} strokeWidth="1" opacity=".5" fill="none" strokeDasharray="2 2" />)}</g>);
    case "terracotta":
      return (<g><path d="M40 28c0-4 4-6 10-6s10 2 10 6c0 6-6 8-6 14 12 6 20 18 20 32 0 16-10 30-24 30S26 90 26 74c0-14 8-26 20-32 0-6-6-8-6-14z" fill={fill} /><path d="M30 70q20 8 40 0M31 82q19 8 38 0" stroke={hi} strokeWidth="1.4" opacity=".4" fill="none" /><path d="M36 58c-4 8-4 24 0 34" stroke={hi} strokeWidth="2.2" strokeLinecap="round" opacity=".35" fill="none" /></g>);
    case "wooden-trays":
      return (<g><rect x="12" y="52" width="76" height="34" rx="8" fill={fill} /><rect x="20" y="58" width="60" height="22" rx="4" fill={hi} opacity=".28" /><rect x="6" y="62" width="8" height="8" rx="3" fill={fill} /><rect x="86" y="62" width="8" height="8" rx="3" fill={fill} />{[64, 69, 74].map((y) => <path key={y} d={`M24 ${y}h52`} stroke={hi} strokeWidth=".8" opacity=".3" />)}</g>);
    case "coasters":
      return (<g><circle cx="50" cy="66" r="30" fill={fill} /><circle cx="50" cy="66" r="24" fill="none" stroke={hi} strokeWidth="1.4" opacity=".6" />{Array.from({ length: 8 }).map((_, i) => <ellipse key={i} cx="50" cy="48" rx="3.5" ry="9" fill={hi} opacity=".45" transform={`rotate(${i * 45} 50 66)`} />)}<circle cx="50" cy="66" r="4" fill={hi} opacity=".7" /></g>);
    case "paintings":
      return (<g><rect x="20" y="22" width="60" height="82" fill={fill} /><rect x="26" y="28" width="48" height="70" fill={hi} opacity=".22" /><circle cx="50" cy="52" r="11" fill={hi} opacity=".55" /><path d="M26 98c8-14 16-18 24-18s16 4 24 18z" fill={hi} opacity=".45" /><path d="M36 40h28" stroke={hi} strokeWidth="1" opacity=".5" /></g>);
    case "wall-art":
      return (<g><circle cx="50" cy="62" r="36" fill={fill} /><circle cx="50" cy="62" r="29" fill="none" stroke={hi} strokeWidth="1.2" opacity=".55" />{Array.from({ length: 12 }).map((_, i) => <path key={i} d="M50 62V36" stroke={hi} strokeWidth="1.2" opacity=".5" transform={`rotate(${i * 30} 50 62)`} />)}<circle cx="50" cy="62" r="9" fill={hi} opacity=".5" /></g>);
    case "jute-bags":
      return (<g><path d="M36 48c0-16 6-24 14-24s14 8 14 24" fill="none" stroke={fill} strokeWidth="4" strokeLinecap="round" /><path d="M26 48h48l5 52c.3 4-2.6 7-6.5 7H27.5c-3.900 0-6.800-3-6.500-7z" fill={fill} />{[58, 68, 78, 88, 98].map((y) => <path key={y} d={`M24 ${y}h52`} stroke={hi} strokeWidth=".8" opacity=".3" />)}<rect x="30" y="48" width="40" height="8" fill={hi} opacity=".25" /></g>);
    default:
      return (<g><path d="M24 104V58c0-18 11-30 26-30s26 12 26 30v46z" fill={fill} /><path d="M34 104V60c0-11 6-19 16-19s16 8 16 19v44" fill="none" stroke={hi} strokeWidth="1.4" opacity=".5" /></g>);
  }
}

export function ProductArt({ tone = "sand", kind = "default", alt = false, label, className }: { tone?: Tone; kind?: string; alt?: boolean; label?: string; className?: string }) {
  const id = useId().replace(/:/g, "");
  const c = T[tone];
  return (
    <svg role="img" aria-label={label ?? "Product illustration"} viewBox="0 0 100 125" preserveAspectRatio="xMidYMid slice" className={cn("h-full w-full", className)}>
      <defs>
        <linearGradient id={`bg${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={c.bg1} /><stop offset="1" stopColor={c.bg2} /></linearGradient>
        <linearGradient id={`ob${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={c.o1} /><stop offset="1" stopColor={c.o2} /></linearGradient>
        <radialGradient id={`sh${id}`}><stop offset="0" stopColor="#26231f" stopOpacity=".28" /><stop offset="1" stopColor="#26231f" stopOpacity="0" /></radialGradient>
        <pattern id={`pt${id}`} width="14" height="14" patternUnits="userSpaceOnUse"><path d="M7 1l6 6-6 6-6-6z" fill="none" stroke="#fff" strokeWidth=".4" opacity=".35" /></pattern>
      </defs>
      <rect width="100" height="125" fill={`url(#bg${id})`} />
      <rect width="100" height="125" fill={`url(#pt${id})`} />
      <ellipse cx="50" cy="108" rx="30" ry="4" fill={`url(#sh${id})`} />
      <g transform={alt ? "translate(100 0) scale(-1 1) translate(8 6) scale(.92)" : undefined}>
        <Shape kind={kind} fill={`url(#ob${id})`} hi="#fff" />
      </g>
    </svg>
  );
}
