"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Field";
import { Price } from "@/components/ui/Price";
import { useStore } from "@/components/providers/StoreProvider";

type Gateway = { provider: "razorpay" | "mock"; orderId: string; keyId?: string; amount?: number; email?: string; phone?: string };
declare global { interface Window { Razorpay?: new (o: Record<string, unknown>) => { open(): void; on(e: string, cb: (r: { error?: { description?: string; metadata?: { payment_id?: string } } }) => void): void } } }

function loadScript() {
  return new Promise<boolean>((res) => {
    if (window.Razorpay) return res(true);
    const s = document.createElement("script"); s.src = "https://checkout.razorpay.com/v1/checkout.js"; s.onload = () => res(true); s.onerror = () => res(false); document.body.appendChild(s);
  });
}
const post = (url: string, body: unknown) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export function PayPanel({ number, token, amount, email, phone, auto, failed }: { number: string; token: string; amount: number; email: string; phone: string; auto: boolean; failed: boolean }) {
  const router = useRouter();
  const { clearCart } = useStore();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "error" | "info"; text: string } | null>(failed ? { tone: "error", text: "Your last payment attempt didn't go through. You can try again below." } : null);
  const [mock, setMock] = useState(false);
  const started = useRef(false);

  const done = useCallback(() => { clearCart(); try { localStorage.removeItem("kh_coupon"); sessionStorage.removeItem(`kh_pay_${number}`); } catch {} router.replace(`/order/${number}?token=${encodeURIComponent(token)}`); router.refresh(); }, [clearCart, number, token, router]);

  const getGateway = useCallback(async (): Promise<Gateway | null> => {
    try { const raw = sessionStorage.getItem(`kh_pay_${number}`); if (raw) { sessionStorage.removeItem(`kh_pay_${number}`); return JSON.parse(raw) as Gateway; } } catch {}
    const r = await post("/api/payments/retry", { number, token }); const d = await r.json();
    if (!r.ok) { setMsg({ tone: "error", text: d.error ?? "Couldn't start the payment." }); return null; }
    return { ...d.gateway, amount: d.amount, email, phone };
  }, [number, token, email, phone]);

  const pay = useCallback(async () => {
    setBusy(true); setMsg(null);
    const g = await getGateway();
    if (!g) { setBusy(false); return; }
    if (g.provider === "mock") { setMock(true); setBusy(false); return; }
    if (!(await loadScript()) || !window.Razorpay) { setMsg({ tone: "error", text: "Couldn't load the payment window. Check your connection and try again." }); setBusy(false); return; }
    const rz = new window.Razorpay({
      key: g.keyId, amount: Math.round((g.amount ?? amount) * 100), currency: "INR", name: "Nazi Creation", description: `Order ${number}`, order_id: g.orderId,
      prefill: { email, contact: phone }, theme: { color: "#572e35" },
      handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        setMsg({ tone: "info", text: "Confirming your payment…" });
        const res = await post("/api/payments/verify", { number, token, ...r }); const d = await res.json().catch(() => ({}));
        if (res.ok && d.ok) done(); else { setMsg({ tone: res.status === 202 ? "info" : "error", text: d.message ?? d.error ?? "We couldn't confirm the payment yet." }); setBusy(false); }
      },
      modal: { ondismiss: () => { setBusy(false); setMsg({ tone: "info", text: "Payment window closed. Your order is held for 30 minutes — you can resume any time." }); } },
    });
    rz.on("payment.failed", (r) => { post("/api/payments/failed", { number, token, reason: r.error?.description, paymentId: r.error?.metadata?.payment_id }); setMsg({ tone: "error", text: r.error?.description ?? "Payment failed. Please try again." }); setBusy(false); });
    rz.open();
  }, [getGateway, amount, number, token, email, phone, done]);

  useEffect(() => { if (auto && !started.current) { started.current = true; void pay(); } }, [auto, pay]);

  async function simulate(outcome: "success" | "failure") {
    setBusy(true);
    const r = await post("/api/payments/mock", { number, token, outcome });
    const d = await r.json().catch(() => ({}));
    if (outcome === "success" && d.ok) done();
    else { setMock(false); setMsg({ tone: "error", text: "Test payment was declined." }); setBusy(false); router.refresh(); }
  }

  return (
    <div className="border border-charcoal/10 bg-beige/40 p-6">
      <h2 className="font-serif text-2xl">Complete your payment</h2>
      <p className="mt-1 text-sm text-charcoal/70">Amount due: <strong><Price inr={amount} /></strong>. Your pieces are reserved for 30 minutes.</p>
      {msg && <div className="mt-4"><Notice tone={msg.tone === "error" ? "error" : "info"}>{msg.text}</Notice></div>}
      {mock ? (
        <div className="mt-5 border border-dashed border-champagne-deep p-5">
          <p className="eyebrow">Test payment</p>
          <p className="mt-2 text-sm">This is a simulated gateway. Real Razorpay opens automatically once API keys are added.</p>
          <div className="mt-4 flex flex-wrap gap-3"><Button disabled={busy} onClick={() => simulate("success")}>Simulate successful payment</Button><Button variant="outline" disabled={busy} onClick={() => simulate("failure")}>Simulate failure</Button></div>
        </div>
      ) : (
        <Button size="lg" className="mt-5" disabled={busy} onClick={pay}><Lock size={14} /> {busy ? "Opening…" : "Pay now"}</Button>
      )}
    </div>
  );
}
