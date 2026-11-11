import { NextResponse } from "next/server";
import { suggest } from "@/server/catalog";
import { clientIp, rateLimit } from "@/server/security";

export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  if (!rateLimit(`sug:${clientIp(req.headers)}`, 90, 60_000).ok) return NextResponse.json({ products: [], categories: [] }, { status: 429 });
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 60);
  if (q.length < 2) return NextResponse.json({ products: [], categories: [] });
  const s = suggest(q);
  return NextResponse.json({
    products: s.products.map((p) => ({ slug: p.slug, name: p.name, price: p.price, craft: p.craft, tone: p.tone, alt_tone: p.alt_tone, category_slug: p.category_slug, image: p.images[0] ?? null })),
    categories: s.categories.map((c) => ({ slug: c.slug, name: c.name })),
  });
}
