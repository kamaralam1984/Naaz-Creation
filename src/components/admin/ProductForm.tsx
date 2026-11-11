"use client";
import { useActionState, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Plus, Trash2, Upload } from "lucide-react";
import { btnCls, fieldCls, labelCls, Panel } from "@/components/admin/ui";
import type { FormState } from "@/app/admin/products/actions";

export type ProductFormData = {
  id: number; name: string; slug: string; description: string; category_id: number | null; artisan_id: number | null; craft: string; material: string; colors: string;
  dimensions: string; weight_g: number | null; care: string; sku: string; price: number; compare_at: number | null; stock: number; low_stock_threshold: number;
  badge: string; tone: string; alt_tone: string; video_url: string; seo_title: string; seo_description: string; is_featured: boolean; is_active: boolean;
  images: string[]; specs: { label: string; value: string }[]; variants: { id: number | null; label: string; sku: string; price: number | null; stock: number }[]; collections: number[]; kind: string;
};
type Opt = { id: number; name: string };

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
async function upload(file: File): Promise<string> {
  const fd = new FormData(); fd.append("file", file);
  const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? "Upload failed");
  return j.url as string;
}
const TONES = ["clay", "brass", "wine", "sand", "ink"];

export function ProductForm({ initial, categories, artisans, collections, action, onDeleteSlot }: { initial: ProductFormData; categories: Opt[]; artisans: Opt[]; collections: Opt[]; action: (s: FormState, fd: FormData) => Promise<FormState>; onDeleteSlot?: React.ReactNode }) {
  const [state, formAction, pending] = useActionState(action, {});
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [slugTouched, setSlugTouched] = useState(!!initial.id);
  const [images, setImages] = useState(initial.images);
  const [video, setVideo] = useState(initial.video_url);
  const [specs, setSpecs] = useState(initial.specs);
  const [variants, setVariants] = useState(initial.variants);
  const [price, setPrice] = useState(String(initial.price || ""));
  const [compare, setCompare] = useState(initial.compare_at ? String(initial.compare_at) : "");
  const [busy, setBusy] = useState<string | null>(null);
  const [upErr, setUpErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);

  const disc = Number(compare) > Number(price) && Number(price) > 0 ? Math.round((1 - Number(price) / Number(compare)) * 100) : 0;
  const hasVariants = variants.length > 0;
  const variantStock = variants.reduce((s, v) => s + (Number(v.stock) || 0), 0);

  async function addImages(files: FileList | null) {
    if (!files?.length) return; setUpErr(""); setBusy("images");
    try { const urls: string[] = []; for (const f of Array.from(files)) urls.push(await upload(f)); setImages((c) => [...c, ...urls].slice(0, 10)); }
    catch (e) { setUpErr(e instanceof Error ? e.message : "Upload failed"); }
    setBusy(null); if (fileRef.current) fileRef.current.value = "";
  }
  async function addVideo(files: FileList | null) {
    if (!files?.[0]) return; setUpErr(""); setBusy("video");
    try { setVideo(await upload(files[0])); } catch (e) { setUpErr(e instanceof Error ? e.message : "Upload failed"); }
    setBusy(null); if (vidRef.current) vidRef.current.value = "";
  }
  const move = (i: number, d: number) => setImages((c) => { const n = [...c]; const j = i + d; if (j < 0 || j >= n.length) return c; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const sel = (n: string, v: string | number | null, opts: Opt[], none = "None") => (
    <select name={n} defaultValue={v ?? ""} className={fieldCls}><option value="">{none}</option>{opts.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
  );

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="id" value={initial.id} />
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <input type="hidden" name="specs" value={JSON.stringify(specs)} />
      <input type="hidden" name="variants" value={JSON.stringify(variants.map((v) => ({ id: v.id, label: v.label, sku: v.sku || null, price: v.price === null || (v.price as unknown) === "" ? null : Number(v.price), stock: Number(v.stock) || 0 })))} />
      {state.error && <p role="alert" className="border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">{state.error}</p>}

      <Panel title="Basics">
        <div className="grid gap-4 md:grid-cols-2">
          <div><label className={labelCls} htmlFor="name">Name *</label><input id="name" name="name" required value={name} onChange={(e) => { setName(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }} className={fieldCls} /></div>
          <div><label className={labelCls} htmlFor="slug">URL slug *</label><input id="slug" name="slug" required value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} className={fieldCls} /></div>
          <div className="md:col-span-2"><label className={labelCls} htmlFor="description">Description</label><textarea id="description" name="description" rows={6} defaultValue={initial.description} className={fieldCls + " h-auto py-2"} /></div>
          <div><label className={labelCls}>Category</label>{sel("category_id", initial.category_id, categories, "Uncategorised")}</div>
          <div><label className={labelCls}>Artisan</label>{sel("artisan_id", initial.artisan_id, artisans)}</div>
          <div><label className={labelCls} htmlFor="craft">Craft type</label><input id="craft" name="craft" defaultValue={initial.craft} className={fieldCls} placeholder="e.g. Dokra" /></div>
          <div><label className={labelCls} htmlFor="material">Material</label><input id="material" name="material" defaultValue={initial.material} className={fieldCls} /></div>
          <div><label className={labelCls} htmlFor="colors">Colours (comma separated)</label><input id="colors" name="colors" defaultValue={initial.colors} className={fieldCls} placeholder="Copper, Antique Gold" /></div>
          <div><label className={labelCls} htmlFor="dimensions">Dimensions</label><input id="dimensions" name="dimensions" defaultValue={initial.dimensions} className={fieldCls} /></div>
          <div><label className={labelCls} htmlFor="weight_g">Weight (grams)</label><input id="weight_g" name="weight_g" type="number" min={0} defaultValue={initial.weight_g ?? ""} className={fieldCls} /></div>
          <div><label className={labelCls} htmlFor="badge">Badge</label>
            <select id="badge" name="badge" defaultValue={initial.badge} className={fieldCls}>{["", "New", "Best Seller", "Sale", "Limited"].map((b) => <option key={b} value={b}>{b || "None"}</option>)}</select></div>
          <div className="md:col-span-2"><label className={labelCls} htmlFor="care">Care instructions</label><textarea id="care" name="care" rows={3} defaultValue={initial.care} className={fieldCls + " h-auto py-2"} /></div>
        </div>
      </Panel>

      <Panel title="Pricing & stock">
        <div className="grid gap-4 md:grid-cols-4">
          <div><label className={labelCls} htmlFor="price">Price (₹, incl. tax) *</label><input id="price" name="price" type="number" min={1} required value={price} onChange={(e) => setPrice(e.target.value)} className={fieldCls} /></div>
          <div><label className={labelCls} htmlFor="compare_at">Original price (₹)</label><input id="compare_at" name="compare_at" type="number" min={0} value={compare} onChange={(e) => setCompare(e.target.value)} className={fieldCls} />
            <p className="mt-1 text-xs text-charcoal/60" aria-live="polite">{disc ? `Shown as ${disc}% off` : compare && Number(compare) <= Number(price) ? "Must be higher than the price" : "Leave empty for no discount"}</p></div>
          <div><label className={labelCls} htmlFor="sku">SKU *</label><input id="sku" name="sku" required defaultValue={initial.sku} className={fieldCls} /></div>
          <div><label className={labelCls} htmlFor="low_stock_threshold">Low-stock alert at</label><input id="low_stock_threshold" name="low_stock_threshold" type="number" min={0} defaultValue={initial.low_stock_threshold} className={fieldCls} /></div>
          <div><label className={labelCls} htmlFor="stock">Stock {hasVariants && "(from variants)"}</label>
            <input id="stock" name="stock" type="number" min={0} value={hasVariants ? variantStock : undefined} defaultValue={hasVariants ? undefined : initial.stock} readOnly={hasVariants} className={fieldCls + (hasVariants ? " bg-beige/50" : "")} /></div>
        </div>
      </Panel>

      <Panel title="Variants" actions={<button type="button" onClick={() => setVariants((c) => [...c, { id: null, label: "", sku: "", price: null, stock: 0 }])} className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.14em] underline"><Plus size={14} /> Add variant</button>}>
        {!variants.length ? <p className="text-sm text-charcoal/60">No variants — the product is sold as a single option. Add variants for sizes, sets or finishes; stock is then tracked per variant.</p> : (
          <div className="space-y-3">
            <div className="hidden grid-cols-[2fr_1.2fr_1fr_1fr_auto] gap-3 md:grid"><span className={labelCls}>Label</span><span className={labelCls}>SKU</span><span className={labelCls}>Price override ₹</span><span className={labelCls}>Stock</span><span /></div>
            {variants.map((v, i) => (
              <div key={i} className="grid grid-cols-2 items-center gap-3 md:grid-cols-[2fr_1.2fr_1fr_1fr_auto]">
                <input aria-label="Variant label" placeholder="e.g. Large" value={v.label} onChange={(e) => setVariants((c) => c.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} className={fieldCls + " col-span-2 md:col-span-1"} />
                <input aria-label="Variant SKU" placeholder="auto" value={v.sku} onChange={(e) => setVariants((c) => c.map((x, j) => (j === i ? { ...x, sku: e.target.value } : x)))} className={fieldCls} />
                <input aria-label="Variant price" type="number" min={1} placeholder="same" value={v.price ?? ""} onChange={(e) => setVariants((c) => c.map((x, j) => (j === i ? { ...x, price: e.target.value === "" ? null : Number(e.target.value) } : x)))} className={fieldCls} />
                <input aria-label="Variant stock" type="number" min={0} value={v.stock} onChange={(e) => setVariants((c) => c.map((x, j) => (j === i ? { ...x, stock: Number(e.target.value) } : x)))} className={fieldCls} />
                <button type="button" aria-label="Remove variant" onClick={() => setVariants((c) => c.filter((_, j) => j !== i))} className="p-2 text-burgundy"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Images & video">
        <div className="flex flex-wrap gap-3">
          {images.map((src, i) => (
            <div key={src + i} className="w-32">
              <div className="relative aspect-[4/5] overflow-hidden bg-beige">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={src} alt={`Product image ${i + 1}`} className="h-full w-full object-contain" />{i === 0 && <span className="absolute left-1 top-1 bg-charcoal px-1.5 py-0.5 text-[0.6rem] uppercase text-ivory">Cover</span>}</div>
              <div className="mt-1 flex justify-between">
                <button type="button" aria-label="Move left" onClick={() => move(i, -1)} className="p-1.5" disabled={i === 0}><ArrowLeft size={14} /></button>
                <button type="button" aria-label="Remove image" onClick={() => setImages((c) => c.filter((_, j) => j !== i))} className="p-1.5 text-burgundy"><Trash2 size={14} /></button>
                <button type="button" aria-label="Move right" onClick={() => move(i, 1)} className="p-1.5" disabled={i === images.length - 1}><ArrowRight size={14} /></button>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => fileRef.current?.click()} disabled={busy === "images" || images.length >= 10} className="flex aspect-[4/5] w-32 flex-col items-center justify-center gap-2 border border-dashed border-charcoal/40 text-xs hover:bg-beige/50 disabled:opacity-50"><Upload size={18} />{busy === "images" ? "Uploading…" : "Add images"}</button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={(e) => addImages(e.target.files)} />
        </div>
        <p className="mt-2 text-xs text-charcoal/55">JPG, PNG, WebP or AVIF up to 6 MB, max 10. The first image is the cover; the second shows on hover. Without images an illustration is used.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
          <div><label className={labelCls} htmlFor="video_url">Product video (URL or upload)</label><input id="video_url" name="video_url" value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://… or /uploads/…" className={fieldCls} /></div>
          <button type="button" onClick={() => vidRef.current?.click()} disabled={busy === "video"} className="inline-flex h-10 items-center gap-2 self-end border border-charcoal/40 px-4 text-xs uppercase tracking-[0.14em]"><Upload size={14} />{busy === "video" ? "Uploading…" : "Upload MP4/WebM"}</button>
          <input ref={vidRef} type="file" accept="video/mp4,video/webm" hidden onChange={(e) => addVideo(e.target.files)} />
        </div>
        {upErr && <p role="alert" className="mt-3 text-sm text-danger">{upErr}</p>}
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div><label className={labelCls} htmlFor="tone">Illustration tone (fallback)</label><select id="tone" name="tone" defaultValue={initial.tone} className={fieldCls}>{TONES.map((t) => <option key={t}>{t}</option>)}</select></div>
          <div><label className={labelCls} htmlFor="alt_tone">Alternate tone</label><select id="alt_tone" name="alt_tone" defaultValue={initial.alt_tone} className={fieldCls}>{TONES.map((t) => <option key={t}>{t}</option>)}</select></div>
        </div>
      </Panel>

      <Panel title="Specifications" actions={<button type="button" onClick={() => setSpecs((c) => [...c, { label: "", value: "" }])} className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.14em] underline"><Plus size={14} /> Add row</button>}>
        {!specs.length && <p className="text-sm text-charcoal/60">Optional label/value rows shown on the product page (Origin, Finish, …).</p>}
        <div className="space-y-2">{specs.map((s, i) => (
          <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-3">
            <input aria-label="Spec label" placeholder="Label" value={s.label} onChange={(e) => setSpecs((c) => c.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} className={fieldCls} />
            <input aria-label="Spec value" placeholder="Value" value={s.value} onChange={(e) => setSpecs((c) => c.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} className={fieldCls} />
            <button type="button" aria-label="Remove row" onClick={() => setSpecs((c) => c.filter((_, j) => j !== i))} className="p-2 text-burgundy"><Trash2 size={16} /></button>
          </div>))}</div>
      </Panel>

      <Panel title="Collections & visibility">
        <fieldset><legend className={labelCls}>Collections</legend>
          <div className="flex flex-wrap gap-x-6 gap-y-2">{collections.map((c) => <label key={c.id} className="flex items-center gap-2 text-sm"><input type="checkbox" name="collections" value={c.id} defaultChecked={initial.collections.includes(c.id)} /> {c.name}</label>)}{!collections.length && <p className="text-sm text-charcoal/60">No collections yet.</p>}</div></fieldset>
        <div className="mt-5 flex flex-wrap gap-8">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_featured" defaultChecked={initial.is_featured} /> Featured product</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={initial.is_active} /> Visible in the store</label>
        </div>
      </Panel>

      <Panel title="SEO">
        <div className="grid gap-4">
          <div><label className={labelCls} htmlFor="seo_title">Meta title</label><input id="seo_title" name="seo_title" maxLength={120} defaultValue={initial.seo_title} className={fieldCls} /></div>
          <div><label className={labelCls} htmlFor="seo_description">Meta description</label><textarea id="seo_description" name="seo_description" maxLength={300} rows={2} defaultValue={initial.seo_description} className={fieldCls + " h-auto py-2"} /></div>
        </div>
      </Panel>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <button className={btnCls} disabled={pending || busy !== null}>{pending ? "Saving…" : initial.id ? "Save changes" : "Create product"}</button>
        {onDeleteSlot}
      </div>
    </form>
  );
}
