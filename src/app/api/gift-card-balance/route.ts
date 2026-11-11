import { NextResponse } from "next/server";
import { z } from "zod";
import { giftCardBalance } from "@/server/content";
import { clientIp, rateLimit, sameOrigin } from "@/server/security";

export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!rateLimit(`gcb:${clientIp(req.headers)}`, 8, 10 * 60_000).ok) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  const p = z.object({ code: z.string().trim().min(4).max(40) }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Enter your gift card code." }, { status: 400 });
  const b = giftCardBalance(p.data.code);
  if (!b) return NextResponse.json({ error: "We couldn't find that code." }, { status: 404 });
  return NextResponse.json(b);
}
