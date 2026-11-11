import { NextResponse } from "next/server";
import { z } from "zod";
import { subscribeNewsletter } from "@/server/content";
import { clientIp, emailSchema, rateLimit, sameOrigin } from "@/server/security";

export const dynamic = "force-dynamic";
const schema = z.object({ email: emailSchema, source: z.string().max(40).optional(), website: z.string().max(200).optional() });

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!rateLimit(`nl:${clientIp(req.headers)}`, 6, 10 * 60_000).ok) return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  if (p.data.website) return NextResponse.json({ ok: true }); // honeypot: pretend success
  const r = await subscribeNewsletter(p.data.email, p.data.source ?? "site");
  return NextResponse.json({ ok: true, status: r });
}
