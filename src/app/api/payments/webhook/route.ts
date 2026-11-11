import { NextResponse } from "next/server";
import { get, run } from "@/server/db";
import { getOrder, markOrderPaid, markPaymentFailed } from "@/server/orders";
import { verifyWebhookSignature } from "@/server/payments";
import type { OrderRow } from "@/server/types";

export const dynamic = "force-dynamic";

type Evt = { event: string; payload?: { payment?: { entity?: { id: string; order_id?: string; amount: number; method?: string; status?: string; error_description?: string } }; order?: { entity?: { id: string } } } };

/**
 * Razorpay webhook. Configure in the Razorpay dashboard → Webhooks:
 *   URL: https://<your-domain>/api/payments/webhook   Events: payment.captured, payment.failed, order.paid
 *   Secret → RAZORPAY_WEBHOOK_SECRET
 * Verified by HMAC over the RAW body; duplicates are ignored via x-razorpay-event-id.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature"))) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  const eventId = req.headers.get("x-razorpay-event-id");
  if (eventId) {
    if (get("SELECT 1 FROM webhook_events WHERE id = ?", eventId)) return NextResponse.json({ ok: true, duplicate: true });
  }
  let evt: Evt;
  try { evt = JSON.parse(raw); } catch { return NextResponse.json({ error: "Bad payload" }, { status: 400 }); }

  const pay = evt.payload?.payment?.entity;
  const gatewayOrderId = pay?.order_id ?? evt.payload?.order?.entity?.id;
  const order = gatewayOrderId ? get<OrderRow>("SELECT * FROM orders WHERE razorpay_order_id = ?", gatewayOrderId) : undefined;

  try {
    if (order && pay) {
      if ((evt.event === "payment.captured" || evt.event === "order.paid") && pay.amount === order.total * 100) {
        markOrderPaid(order.id, { provider: "razorpay", paymentId: pay.id, method: pay.method ?? "razorpay", raw: pay });
      } else if (evt.event === "payment.failed" && getOrder(order.id)?.payment_status !== "paid") {
        markPaymentFailed(order.id, pay.error_description ?? "Payment failed", pay.id);
      }
    }
    if (eventId) run("INSERT OR IGNORE INTO webhook_events(id, type, payload) VALUES(?,?,?)", eventId, evt.event, raw.slice(0, 4000));
  } catch (e) {
    console.error("[webhook]", e);
    return NextResponse.json({ error: "Processing error" }, { status: 500 }); // Razorpay will retry
  }
  return NextResponse.json({ ok: true });
}
