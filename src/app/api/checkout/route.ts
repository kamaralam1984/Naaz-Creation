import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/server/auth";
import { attachGatewayOrder, CheckoutError, createOrder, markOrderPaid } from "@/server/orders";
import { createGatewayOrder, paymentsAvailable, razorpayConfigured, razorpayKeyId } from "@/server/payments";
import { addressSchema, clientIp, emailSchema, flat, phoneSchema, rateLimit, sameOrigin } from "@/server/security";
import { priceCart } from "@/server/pricing";

export const dynamic = "force-dynamic";

const schema = z.object({
  lines: z.array(z.object({ productId: z.number().int().positive(), variantId: z.number().int().positive().nullable().optional(), qty: z.number().int().min(1).max(50), meta: z.object({ recipientEmail: z.string().email().max(200).optional(), message: z.string().max(300).optional() }).optional() })).min(1).max(60),
  email: emailSchema, phone: phoneSchema, shipping: addressSchema, billing: addressSchema,
  deliveryMethod: z.enum(["standard", "express"]), couponCode: z.string().max(40).nullish(), giftWrap: z.boolean().optional(), giftMessage: z.string().max(300).nullish(),
  giftCardCode: z.string().max(40).nullish(), usePoints: z.number().int().min(0).max(100000).optional(), notes: z.string().max(500).nullish(),
  idempotencyKey: z.string().min(16).max(80),
});

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!rateLimit(`checkout:${clientIp(req.headers)}`, 20, 600_000).ok) return NextResponse.json({ error: "Too many attempts. Please wait a few minutes." }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: flat(parsed.error) }, { status: 400 });
  const d = parsed.data;
  if (!paymentsAvailable()) return NextResponse.json({ error: "Online payments aren't switched on yet. Please contact us to place this order." }, { status: 503 });

  const user = await getUser();
  try {
    const { order, reused } = createOrder({ ...d, userId: user?.id ?? null, lines: d.lines });
    if (order.payment_status === "paid") return NextResponse.json({ number: order.number, token: order.access_token, paid: true });

    // Nothing left to pay (gift card / points covered everything)
    if (order.total === 0) {
      markOrderPaid(order.id, { provider: "internal", paymentId: `internal_${order.id}`, method: order.gift_card_used ? "gift_card" : "loyalty_points" });
      return NextResponse.json({ number: order.number, token: order.access_token, paid: true });
    }

    let gatewayId = order.razorpay_order_id;
    if (!gatewayId || !reused) {
      const g = await createGatewayOrder(order.total, order.number);
      gatewayId = g.id;
      attachGatewayOrder(order.id, g.id);
    }
    return NextResponse.json({
      number: order.number, token: order.access_token, amount: order.total, currency: "INR",
      gateway: razorpayConfigured() ? { provider: "razorpay", keyId: razorpayKeyId(), orderId: gatewayId } : { provider: "mock", orderId: gatewayId },
    });
  } catch (e) {
    if (e instanceof CheckoutError) return NextResponse.json({ error: e.message }, { status: 409 });
    console.error("[checkout]", e);
    return NextResponse.json({ error: "We couldn't start the payment. Please try again." }, { status: 500 });
  }
}

/** Dry-run pricing for a given cart (used by the cart page for coupon feedback). */
export async function GET() { return NextResponse.json({ ok: true, preview: priceCart([]).total }); }
