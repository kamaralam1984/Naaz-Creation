import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/server/auth";
import { pushRecentlyViewed } from "@/server/catalog";
import { sameOrigin } from "@/server/security";

export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const u = await getUser();
  const p = z.object({ productId: z.number().int().positive() }).safeParse(await req.json().catch(() => null));
  if (u && p.success) pushRecentlyViewed(u.id, p.data.productId);
  return NextResponse.json({ ok: true });
}
