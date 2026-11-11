import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/server/auth";
import { get, json, run } from "@/server/db";
import { sameOrigin } from "@/server/security";
import type { CartLine } from "@/server/types";

export const dynamic = "force-dynamic";
const line = z.object({ productId: z.number().int().positive(), variantId: z.number().int().positive().nullable().optional(), qty: z.number().int().min(1).max(50), meta: z.object({ recipientEmail: z.string().email().max(200).optional(), message: z.string().max(300).optional() }).optional() });

export async function GET() {
  const u = await getUser();
  if (!u) return NextResponse.json({ lines: [] });
  return NextResponse.json({ lines: json<CartLine[]>(get<{ data: string }>("SELECT data FROM carts WHERE user_id = ?", u.id)?.data, []) });
}
export async function PUT(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const u = await getUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = z.object({ lines: z.array(line).max(60) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid cart" }, { status: 400 });
  run("INSERT INTO carts(user_id, data) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = datetime('now'), reminder_sent_at = NULL", u.id, JSON.stringify(parsed.data.lines));
  return NextResponse.json({ ok: true });
}
