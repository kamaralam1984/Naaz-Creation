import { inr } from "@/lib/format";

type Pt = { label: string; value: number };
const short = (n: number) => (n >= 1e5 ? `${(n / 1e5).toFixed(1)}L` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : String(n));

/** Accessible inline-SVG bar chart (no dependencies). A visually-hidden table mirrors the data. */
export function BarChart({ data, title, currency = true, showValues = true, height = 220 }: { data: Pt[]; title: string; currency?: boolean; showValues?: boolean; height?: number }) {
  const W = 720, padT = 22, padB = 26, innerH = height - padT - padB;
  const max = Math.max(...data.map((d) => d.value), 1);
  const slot = W / data.length, bw = Math.min(slot * 0.62, 44);
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${height}`} role="img" aria-label={title} className="h-auto w-full">
        <title>{title}</title>
        {[0.25, 0.5, 0.75, 1].map((g) => <line key={g} x1="0" x2={W} y1={padT + innerH * (1 - g)} y2={padT + innerH * (1 - g)} stroke="#26231f" strokeOpacity=".08" />)}
        {data.map((d, i) => {
          const h = (d.value / max) * innerH, x = i * slot + (slot - bw) / 2, y = padT + innerH - h;
          return (
            <g key={d.label + i}>
              <rect x={x} y={y} width={bw} height={Math.max(h, d.value > 0 ? 2 : 0)} fill={d.value === max ? "#572e35" : "#c4a46a"}><title>{`${d.label}: ${currency ? inr(d.value) : d.value}`}</title></rect>
              {showValues && d.value > 0 && <text x={x + bw / 2} y={y - 5} textAnchor="middle" fontSize="11" fill="#26231f">{currency ? short(d.value) : d.value}</text>}
              <text x={x + bw / 2} y={height - 8} textAnchor="middle" fontSize="11" fill="#26231f" fillOpacity=".65">{d.label}</text>
            </g>
          );
        })}
      </svg>
      <figcaption className="sr-only">
        <table><caption>{title}</caption><tbody>{data.map((d, i) => <tr key={i}><th>{d.label}</th><td>{currency ? inr(d.value) : d.value}</td></tr>)}</tbody></table>
      </figcaption>
    </figure>
  );
}

/** Horizontal share bars (CSS only). */
export function ShareBars({ rows, format = inr }: { rows: { label: string; value: number; note?: string }[]; format?: (n: number) => string }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  if (!rows.length) return <p className="text-sm text-charcoal/55">No data yet.</p>;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex justify-between text-sm"><span className="capitalize">{r.label.replace(/_/g, " ")}{r.note && <span className="text-charcoal/50"> · {r.note}</span>}</span><span className="font-medium">{format(r.value)}</span></div>
          <div className="mt-1 h-1.5 bg-beige" role="presentation"><div className="h-full bg-champagne-deep" style={{ width: `${(r.value / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}
