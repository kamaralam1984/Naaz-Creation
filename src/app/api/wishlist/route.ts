import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/server/auth";
import { toggleWishlist, wishlistIds } from "@/server/catalog";
import { sameOrigin } from "@/server/security";

export const dynamic = "force-dynamic";
export async function GET() {
  const u = await getUser();
  return NextResponse.json({ ids: u ? wishlistIds(u.id) : [] });
}
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const u = await getUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const p = z.object({ productId: z.number().int().positive(), ensure: z.boolean().optional() }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const had = wishlistIds(u.id).includes(p.data.productId);
  const added = p.data.ensure && had ? true : toggleWishlist(u.id, p.data.productId);
  return NextResponse.json({ ids: wishlistIds(u.id), added });
}
