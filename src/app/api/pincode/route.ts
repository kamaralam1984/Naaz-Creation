import { NextResponse } from "next/server";
import { estimateDelivery } from "@/server/pricing";
import { clientIp, rateLimit } from "@/server/security";

export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  if (!rateLimit(`pin:${clientIp(req.headers)}`, 60, 60_000).ok) return NextResponse.json({ serviceable: false, message: "Too many requests" }, { status: 429 });
  const sp = new URL(req.url).searchParams;
  return NextResponse.json(estimateDelivery((sp.get("pin") ?? "").trim(), sp.get("express") === "1"));
}
