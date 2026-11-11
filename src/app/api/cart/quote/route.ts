import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/server/auth";
import { priceCart } from "@/server/pricing";
import { clientIp, rateLimit, sameOrigin } from "@/server/security";

export const dynamic = "force-dynamic";
const schema = z.object({
  lines: z.array(z.object({ productId: z.number().int().positive(), variantId: z.number().int().positive().nullable().optional(), qty: z.number().int().min(1).max(50), meta: z.object({ recipientEmail: z.string().max(200).optional(), message: z.string().max(300).optional() }).optional() })).max(60),
  couponCode: z.string().max(40).nullish(), deliveryMethod: z.enum(["standard", "express"]).optional(), country: z.string().max(60).nullish(),
  giftWrap: z.boolean().optional(), giftCardCode: z.string().max(40).nullish(), usePoints: z.number().int().min(0).max(100000).optional(),
});

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!rateLimit(`quote:${clientIp(req.headers)}`, 120, 60_000).ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const u = await getUser();
  const { lines, ...opts } = parsed.data;
  return NextResponse.json(priceCart(lines, { ...opts, userId: u?.id ?? null }));
}
