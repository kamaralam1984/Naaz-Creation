"use client";
import { useState } from "react";

/** Uploads to /api/admin/upload and stores the resulting URL in a hidden input. */
export function MarketingImageField({ name, label, initial }: { name: string; label: string; initial?: string | null }) {
  const [url, setUrl] = useState(initial ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function onFile(f: File | undefined) {
    if (!f) return;
    setBusy(true); setErr("");
    const fd = new FormData(); fd.append("file", f);
    try {
      const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) setErr(d.error ?? "Upload failed"); else setUrl(d.url);
    } catch { setErr("Upload failed"); }
    setBusy(false);
  }
  return (
    <div>
      <span className="mb-1 block text-[0.68rem] font-medium uppercase tracking-[0.14em] text-charcoal/65">{label}</span>
      <input type="hidden" name={name} value={url} />
      <div className="flex items-center gap-4">
        {url ? <img src={url} alt="" className="h-16 w-16 border border-charcoal/15 object-cover" /> : <div className="h-16 w-16 border border-dashed border-charcoal/30" />}
        <div className="text-sm">
          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(e) => onFile(e.target.files?.[0])} aria-label={`Upload ${label}`} />
          {url && <button type="button" onClick={() => setUrl("")} className="mt-1 block text-xs text-burgundy underline">Remove</button>}
          {busy && <p className="text-xs text-charcoal/60">Uploading…</p>}
          {err && <p role="alert" className="text-xs text-danger">{err}</p>}
        </div>
      </div>
    </div>
  );
}

export function MarketingConfirmButton({ children, message, className, name, value }: { children: React.ReactNode; message: string; className?: string; name?: string; value?: string }) {
  return <button type="submit" name={name} value={value} className={className} onClick={(e) => { if (!confirm(message)) e.preventDefault(); }}>{children}</button>;
}

export function MarketingProductPicker({ products, selected, name = "product_ids" }: { products: { id: number; name: string; sku: string }[]; selected: number[]; name?: string }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(new Set(selected));
  const list = products.filter((p) => !q || (p.name + p.sku).toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" aria-label="Search products" className="mb-2 h-10 w-full border border-charcoal/25 bg-white px-3 text-sm" />
      <ul className="max-h-72 divide-y divide-charcoal/10 overflow-y-auto border border-charcoal/15 bg-white">
        {list.map((p) => (
          <li key={p.id}><label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-beige/40">
            <input type="checkbox" checked={sel.has(p.id)} onChange={() => setSel((s) => { const n = new Set(s); if (n.has(p.id)) n.delete(p.id); else n.add(p.id); return n; })} />
            <span className="flex-1">{p.name}</span><span className="text-xs text-charcoal/50">{p.sku}</span>
          </label></li>
        ))}
        {!list.length && <li className="px-3 py-3 text-sm text-charcoal/60">No matches</li>}
      </ul>
      {[...sel].map((id) => <input key={id} type="hidden" name={name} value={id} />)}
      <p className="mt-1 text-xs text-charcoal/60">{sel.size} selected</p>
    </div>
  );
}
