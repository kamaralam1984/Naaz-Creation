"use client";
import { useStore } from "@/components/providers/StoreProvider";
import { CURRENCIES } from "@/lib/format";

export function CurrencySwitch({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { currency, setCurrency } = useStore();
  return (
    <label className="inline-flex items-center gap-2 text-xs">
      <span className="sr-only">Display currency</span>
      <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={tone === "light" ? "border border-ivory/30 bg-charcoal px-2 py-1.5 text-ivory" : "border border-charcoal/30 bg-ivory px-2 py-1.5"}>
        {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
    </label>
  );
}
