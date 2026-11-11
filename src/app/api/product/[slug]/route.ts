import { NextResponse } from "next/server";
import { getProductBySlug, getVariants } from "@/server/catalog";

export const dynamic = "force-dynamic";
export async function GET(_: Request, ctx: RouteContext<"/api/product/[slug]">) {
  const { slug } = await ctx.params;
  const p = getProductBySlug(slug);
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product: p, variants: getVariants(p.id) });
}
