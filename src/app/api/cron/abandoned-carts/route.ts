import { NextResponse } from "next/server";
import { sendAbandonedCartReminders } from "@/server/orders";
import { safeEqual } from "@/server/security";

export const dynamic = "force-dynamic";
/** Call hourly from a scheduler: curl -H "Authorization: Bearer $CRON_SECRET" https://site/api/cron/abandoned-carts */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!secret || !given || !safeEqual(given, secret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: true, reminded: await sendAbandonedCartReminders() });
}
