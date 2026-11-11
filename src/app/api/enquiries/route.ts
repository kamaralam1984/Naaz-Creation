import { NextResponse } from "next/server";
import { z } from "zod";
import { createEnquiry } from "@/server/content";
import { clientIp, emailSchema, phoneSchema, rateLimit, sameOrigin } from "@/server/security";

export const dynamic = "force-dynamic";
const schema = z.object({
  type: z.enum(["corporate", "bulk", "custom", "contact"]),
  name: z.string().trim().min(2).max(100), email: emailSchema,
  phone: phoneSchema.optional().or(z.literal("")), company: z.string().trim().max(120).optional(),
  quantity: z.number().int().min(1).max(100000).optional(), budget: z.string().trim().max(60).optional(),
  message: z.string().trim().max(2000).optional(), details: z.record(z.string(), z.unknown()).optional(),
  website: z.string().max(200).optional(), // honeypot
});

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!rateLimit(`enq:${clientIp(req.headers)}`, 5, 10 * 60_000).ok) return NextResponse.json({ error: "Too many submissions. Please try again in a few minutes." }, { status: 429 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: `Please check the ${String(p.error.issues[0]?.path[0] ?? "form")} field.`, field: String(p.error.issues[0]?.path[0] ?? "") }, { status: 400 });
  if (p.data.website) return NextResponse.json({ ok: true, id: 0 });
  const { website: _w, phone, ...rest } = p.data; void _w;
  const id = await createEnquiry({ ...rest, phone: phone || null });
  return NextResponse.json({ ok: true, id });
}
