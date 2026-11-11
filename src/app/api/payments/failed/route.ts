import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/server/auth";
import { authorizeOrderView, getOrderByNumber, markPaymentFailed } from "@/server/orders";
import { sameOrigin } from "@/server/security";

export const dynamic = "force-dynamic";
const schema = z.object({ number: z.string().max(20), token: z.string().max(80).optional(), reason: z.string().max(200).optional(), paymentId: z.string().max(80).nullish() });

/** Client reports a failed/cancelled attempt. Only records it — a paid order can never be downgraded. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const order = getOrderByNumber(p.data.number);
  const user = await getUser();
  if (!order || !authorizeOrderView(order, { userId: user?.id, token: p.data.token })) return NextResponse.json({ error: "Not found" }, { status: 404 });
  markPaymentFailed(order.id, p.data.reason ?? "Payment cancelled or failed", p.data.paymentId);
  return NextResponse.json({ ok: true });
}
