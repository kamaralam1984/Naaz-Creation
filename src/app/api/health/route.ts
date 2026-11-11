import { NextResponse } from "next/server";
import { get } from "@/server/db";

export const dynamic = "force-dynamic";

export function GET() {
  try {
    const p = get<{ n: number }>("SELECT COUNT(*) AS n FROM products")!.n;
    return NextResponse.json({ ok: true, products: p });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
