import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/server/auth";
import { authorizeOrderView, getOrderByNumber, markOrderPaid, markPaymentFailed } from "@/server/orders";
import { mockEnabled } from "@/server/payments";
import { sameOrigin } from "@/server/security";

export const dynamic = "force-dynamic";
const schema = z.object({ number: z.string().max(20), token: z.string().max(80).optional(), outcome: z.enum(["success", "failure"]) });

/** Test-mode gateway. Hard-disabled whenever real Razorpay keys exist (or in production without MOCK_PAYMENTS=1). */
export async function POST(req: Request) {
  if (!mockEnabled() || !sameOrigin(req)) return NextResponse.json({ error: "Not available" }, { status: 404 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const order = getOrderByNumber(p.data.number);
  const user = await getUser();
  if (!order || !order.razorpay_order_id?.startsWith("mock_") || !authorizeOrderView(order, { userId: user?.id, token: p.data.token })) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (p.data.outcome === "failure") { markPaymentFailed(order.id, "Test payment declined", `mockpay_fail_${Date.now()}`); return NextResponse.json({ ok: false }); }
  markOrderPaid(order.id, { provider: "mock", paymentId: `mockpay_${order.id}`, method: "test" });
  return NextResponse.json({ ok: true });
}
