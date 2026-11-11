import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/server/auth";
import { authorizeOrderView, getOrderByNumber, markOrderPaid, markPaymentFailed } from "@/server/orders";
import { capturePayment, fetchPayment, verifyCheckoutSignature } from "@/server/payments";
import { clientIp, rateLimit, sameOrigin } from "@/server/security";

export const dynamic = "force-dynamic";
const schema = z.object({ number: z.string().max(20), token: z.string().max(80).optional(), razorpay_order_id: z.string().max(80), razorpay_payment_id: z.string().max(80), razorpay_signature: z.string().max(200) });

/**
 * Server-side payment verification. We never trust the browser: the HMAC signature is checked,
 * then the payment is re-fetched from Razorpay to confirm order id, amount and status before the order is marked paid.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!rateLimit(`verify:${clientIp(req.headers)}`, 30, 600_000).ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const order = getOrderByNumber(p.data.number);
  const user = await getUser();
  if (!order || !authorizeOrderView(order, { userId: user?.id, token: p.data.token })) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.payment_status === "paid") return NextResponse.json({ ok: true, already: true });
  if (order.razorpay_order_id !== p.data.razorpay_order_id) return NextResponse.json({ error: "Payment doesn't match this order." }, { status: 400 });
  if (!verifyCheckoutSignature(p.data.razorpay_order_id, p.data.razorpay_payment_id, p.data.razorpay_signature)) {
    markPaymentFailed(order.id, "Signature verification failed", p.data.razorpay_payment_id);
    return NextResponse.json({ error: "We couldn't verify this payment." }, { status: 400 });
  }
  try {
    let pay = await fetchPayment(p.data.razorpay_payment_id);
    if (pay.order_id !== order.razorpay_order_id || pay.amount !== order.total * 100) { markPaymentFailed(order.id, "Amount or order mismatch", pay.id); return NextResponse.json({ error: "Payment amount mismatch." }, { status: 400 }); }
    if (pay.status === "authorized") pay = await capturePayment(pay.id, order.total);
    if (pay.status !== "captured") return NextResponse.json({ ok: false, pending: true, message: "Your payment is still being processed. We'll confirm by email." }, { status: 202 });
    markOrderPaid(order.id, { provider: "razorpay", paymentId: pay.id, method: pay.method ?? "razorpay", raw: pay });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[verify]", e);
    return NextResponse.json({ error: "Verification is taking longer than expected. If you were charged, your order will be confirmed automatically." }, { status: 502 });
  }
}
