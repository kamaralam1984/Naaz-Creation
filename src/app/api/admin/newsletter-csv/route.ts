import { NextResponse } from "next/server";
import { all } from "@/server/db";
import { can, getUser } from "@/server/auth";
import { csvResponse } from "@/server/admin-marketing";

export const dynamic = "force-dynamic";
export async function GET() {
  if (!can(await getUser(), "marketing")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = all<{ email: string; source: string | null; subscribed: number; created_at: string }>("SELECT email, source, subscribed, created_at FROM newsletter_subscribers ORDER BY id DESC");
  return csvResponse("subscribers.csv", ["email", "source", "subscribed", "joined"], rows.map((r) => [r.email, r.source, r.subscribed ? "yes" : "no", r.created_at]));
}
