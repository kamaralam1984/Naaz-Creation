export const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED"] as const;
export type Currency = (typeof CURRENCIES)[number];
export const SYMBOL: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£", AED: "AED " };
export function convert(inrAmount: number, currency: string, rates: Record<string, number>) {
  const r = rates[currency] ?? 1;
  const v = inrAmount * r;
  return currency === "INR" ? Math.round(v) : Math.round(v * 100) / 100;
}
export const cartKey = (l: { productId: number; variantId?: number | null; meta?: { recipientEmail?: string } }) => `${l.productId}:${l.variantId ?? 0}:${l.meta?.recipientEmail ?? ""}`;
export const dateFmt = (s: string) => new Date(s.replace(" ", "T") + (s.endsWith("Z") ? "" : "Z")).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
