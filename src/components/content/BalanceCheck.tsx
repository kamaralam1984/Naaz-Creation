"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Notice } from "@/components/ui/Field";
import { inr, dateFmt } from "@/lib/format";

export function BalanceCheck() {
  const [res, setRes] = useState<{ ok: true; balance: number; status: string; expires_at: string | null } | { ok: false; error: string } | null>(null);
  const [busy, setBusy] = useState(false);
  async function check(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true);
    const code = String(new FormData(e.currentTarget).get("code") ?? "");
    const r = await fetch("/api/gift-card-balance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    setRes(r?.ok ? { ok: true, ...d } : { ok: false, error: d.error ?? "Couldn't check right now." });
    setBusy(false);
  }
  return (
    <form onSubmit={check} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <Field label="Gift card code" name="code" required className="flex-1" placeholder="KH-XXXXXXXX" autoComplete="off" />
      <Button type="submit" variant="outline" disabled={busy}>{busy ? "Checking…" : "Check balance"}</Button>
      <div className="sm:basis-full" aria-live="polite">
        {res?.ok && <Notice tone="success">Balance <strong>{inr(res.balance)}</strong> · {res.status}{res.expires_at ? ` · expires ${dateFmt(res.expires_at)}` : ""}</Notice>}
        {res && !res.ok && <Notice tone="error">{res.error}</Notice>}
      </div>
    </form>
  );
}
