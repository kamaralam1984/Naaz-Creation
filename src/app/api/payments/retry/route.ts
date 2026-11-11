import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/server/auth";
import { attachGatewayOrder, authorizeOrderView, getOrderByNumber } from "@/server/orders";
import { createGatewayOrder, paymentsAvailable, razorpayConfigured, razorpayKeyId } from "@/server/payments";
import { clientIp, rateLimit, sameOrigin } from "@/server/security";

export const dynamic = "force-dynamic";
const schema = z.object({ number: z.string().max(20), token: z.string().max(80).optional() });

/** New gateway order for an unpaid, non-cancelled order (after a failed or abandoned attempt). */
export async function POST(req: Request) {
  if (!sameOrigin(req) || !rateLimit(`retry:${clientIp(req.headers)}`, 15, 600_000).ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const order = getOrderByNumber(p.data.number);
  const user = await getUser();
  if (!order || !authorizeOrderView(order, { userId: user?.id, token: p.data.token })) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (order.payment_status === "paid") return NextResponse.json({ error: "This order is already paid." }, { status: 409 });
  if (order.status === "cancelled" || order.stock_released) return NextResponse.json({ error: "This order has expired — please place it again." }, { status: 410 });
  if (!paymentsAvailable()) return NextResponse.json({ error: "Payments unavailable" }, { status: 503 });
  const g = await createGatewayOrder(order.total, order.number);
  attachGatewayOrder(order.id, g.id);
  return NextResponse.json({ amount: order.total, gateway: razorpayConfigured() ? { provider: "razorpay", keyId: razorpayKeyId(), orderId: g.id } : { provider: "mock", orderId: g.id } });
}
