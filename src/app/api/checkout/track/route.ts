import { NextResponse } from "next/server";
import { z } from "zod";
import { trackAbandonedCart } from "@/server/orders";
import { clientIp, emailSchema, rateLimit, sameOrigin } from "@/server/security";

export const dynamic = "force-dynamic";
const schema = z.object({ email: emailSchema, lines: z.array(z.object({ productId: z.number().int().positive(), variantId: z.number().int().positive().nullable().optional(), qty: z.number().int().min(1).max(50) })).min(1).max(60) });

/** Remembers the cart of a visitor who typed their email at checkout so we can send a reminder if they leave. */
export async function POST(req: Request) {
  if (!sameOrigin(req) || !rateLimit(`track:${clientIp(req.headers)}`, 20, 600_000).ok) return NextResponse.json({ ok: false }, { status: 429 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (p.success) trackAbandonedCart(p.data.email, p.data.lines);
  return NextResponse.json({ ok: true });
}
