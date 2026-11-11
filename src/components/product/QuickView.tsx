"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ProductImage } from "@/components/product/ProductImage";
import { Price } from "@/components/ui/Price";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/components/providers/StoreProvider";
import { cn } from "@/lib/cn";
import type { Product, Variant } from "@/server/types";

export function QuickView({ slug, onClose }: { slug: string; onClose: () => void }) {
  const { addToCart, closeDrawer } = useStore();
  const [d, setD] = useState<{ product: Product; variants: Variant[] } | null>(null);
  const [vid, setVid] = useState<number | null>(null);
  const [recipient, setRecipient] = useState("");

  useEffect(() => { fetch(`/api/product/${slug}`).then((r) => r.json()).then(setD).catch(() => onClose()); }, [slug, onClose]);
  useEffect(() => { const f = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", f); document.body.style.overflow = "hidden"; return () => { window.removeEventListener("keydown", f); document.body.style.overflow = ""; }; }, [onClose]);

  const p = d?.product; const variants = d?.variants ?? [];
  const v = variants.find((x) => x.id === vid);
  const stock = v ? v.stock : p?.stock ?? 0;
  const price = v?.price ?? p?.price ?? 0;
  const gift = p?.kind === "giftcard";
  const canAdd = !!p && (stock > 0 || gift) && (!variants.length || !!v) && (!gift || /.+@.+\..+/.test(recipient));

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Quick view">
      <div className="absolute inset-0 bg-charcoal/55" onClick={onClose} />
      <div className="relative grid max-h-[90vh] w-full max-w-3xl overflow-y-auto bg-ivory md:grid-cols-2">
        <button onClick={onClose} aria-label="Close quick view" className="absolute right-3 top-3 z-10 p-2"><X size={20} /></button>
        {!p ? <div className="col-span-2 p-16 text-center text-sm text-charcoal/60">Loading…</div> : (
          <>
            <div className="relative aspect-square md:aspect-auto md:min-h-[26rem]"><ProductImage p={p} sizes="400px" /></div>
            <div className="flex flex-col p-7">
              <p className="eyebrow">{p.craft}</p>
              <h2 className="mt-2 font-serif text-3xl leading-tight">{p.name}</h2>
              <p className="mt-3 text-lg"><Price inr={price} /> {p.compare_at && p.compare_at > price && <s className="ml-2 text-sm text-charcoal/50"><Price inr={p.compare_at} /></s>}</p>
              <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-charcoal/75">{p.description.split("\n")[0]}</p>
              {variants.length > 0 && (
                <fieldset className="mt-5"><legend className="eyebrow mb-2">Option</legend>
                  <div className="flex flex-wrap gap-2">{variants.map((x) => (
                    <button key={x.id} type="button" disabled={x.stock <= 0 && !gift} onClick={() => setVid(x.id)} aria-pressed={vid === x.id}
                      className={cn("border px-3.5 py-2 text-sm disabled:line-through disabled:opacity-40", vid === x.id ? "border-charcoal bg-charcoal text-ivory" : "border-charcoal/30 hover:border-charcoal")}>{x.label}</button>))}</div>
                </fieldset>
              )}
              {gift && <div className="mt-4"><label htmlFor="qv-rcpt" className="eyebrow mb-1 block">Recipient email</label><input id="qv-rcpt" type="email" value={recipient} onChange={(e) => setRecipient(e.target.value)} className="h-11 w-full border border-charcoal/25 bg-transparent px-3 text-sm" /></div>}
              <div className="mt-auto flex flex-col gap-3 pt-6">
                <Button disabled={!canAdd} onClick={() => { addToCart({ productId: p.id, variantId: v?.id ?? null, qty: 1, meta: gift ? { recipientEmail: recipient } : undefined }); onClose(); }}>
                  {stock <= 0 && !gift ? "Sold out" : variants.length && !v ? "Select an option" : "Add to bag"}
                </Button>
                <Link href={`/product/${p.slug}`} onClick={() => { onClose(); closeDrawer(); }} className="link-underline self-center text-xs uppercase tracking-[0.2em]">View full details</Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
