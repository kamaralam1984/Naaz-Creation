import { NextResponse } from "next/server";
import { destroySession } from "@/server/auth";
import { sameOrigin } from "@/server/security";

export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await destroySession();
  return NextResponse.redirect(new URL("/", req.url), 303);
}
