import Image from "next/image";
import { ProductArt } from "./ProductArt";
import type { Product } from "@/server/types";

/** Real photo when uploaded; illustrated stand-in otherwise. */
export function ProductImage({ p, index = 0, sizes = "(min-width:1024px) 25vw, 50vw", priority = false, className = "" }: { p: Pick<Product, "images" | "tone" | "alt_tone" | "category_slug" | "name" | "kind">; index?: number; sizes?: string; priority?: boolean; className?: string }) {
  const src = p.images[index] ?? (index > 0 ? undefined : p.images[0]);
  if (src) return <Image src={src} alt={`${p.name}${index ? ` — view ${index + 1}` : ""}`} fill sizes={sizes} priority={priority} className={`object-contain ${className}`} />;
  return <ProductArt tone={index % 2 ? p.alt_tone : p.tone} alt={index % 2 === 1} kind={p.kind === "giftcard" ? "default" : (p.category_slug ?? "default")} label={`${p.name} — illustration`} />;
}
