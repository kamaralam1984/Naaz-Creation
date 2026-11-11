"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function Newsletter({ source = "home" }: { source?: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [err, setErr] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr(""); setState("busy");
    const fd = new FormData(e.currentTarget);
    try {
      const r = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: fd.get("email"), website: fd.get("website"), source }) });
      const d = await r.json();
      if (r.ok) setState("done"); else { setErr(d.error ?? "Something went wrong."); setState("idle"); }
    } catch { setErr("Network error — please try again."); setState("idle"); }
  }
  return state === "done" ? (
    <p role="status" className="font-serif text-2xl">Thank you — welcome to the house.</p>
  ) : (
    <form onSubmit={submit} className="w-full max-w-md">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="nl-email" className="sr-only">Email address</label>
        <input id="nl-email" name="email" type="email" required autoComplete="email" placeholder="Your email address" className="h-12 flex-1 border border-charcoal/30 bg-transparent px-4 text-sm placeholder:text-charcoal/50 focus:border-charcoal focus:outline-none" />
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        <Button type="submit" disabled={state === "busy"}>{state === "busy" ? "…" : "Subscribe"}</Button>
      </div>
      {err && <p role="alert" className="mt-2 text-sm text-burgundy">{err}</p>}
    </form>
  );
}
