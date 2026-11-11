import { NextResponse } from "next/server";
import { getProductsByIds } from "@/server/catalog";

export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("ids") ?? "").split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 12);
  return NextResponse.json({ products: getProductsByIds(ids) });
}
