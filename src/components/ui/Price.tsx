"use client";
import { useStore } from "@/components/providers/StoreProvider";

/** Renders an INR amount in the shopper's chosen display currency. Charges are always in INR. */
export function Price({ inr, className }: { inr: number; className?: string }) {
  const { price } = useStore();
  return <span className={className}>{price(inr)}</span>;
}
