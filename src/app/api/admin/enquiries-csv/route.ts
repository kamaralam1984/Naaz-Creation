import { NextResponse } from "next/server";
import { all } from "@/server/db";
import { can, getUser } from "@/server/auth";
import { csvResponse } from "@/server/admin-marketing";

export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const u = await getUser();
  if (!can(u, "enquiries")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = new URL(req.url).searchParams;
  const w: string[] = []; const a: string[] = [];
  const type = sp.get("type"), status = sp.get("status"), q = sp.get("q");
  if (type) { w.push("type = ?"); a.push(type); }
  if (status) { w.push("status = ?"); a.push(status); }
  if (q) { w.push("(name LIKE ? OR email LIKE ? OR company LIKE ?)"); a.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  const rows = all<Record<string, unknown>>(`SELECT * FROM enquiries ${w.length ? "WHERE " + w.join(" AND ") : ""} ORDER BY id DESC LIMIT 5000`, ...a);
  return csvResponse("enquiries.csv", ["id", "created_at", "type", "status", "name", "email", "phone", "company", "quantity", "budget", "message"], rows.map((r) => [r.id, r.created_at, r.type, r.status, r.name, r.email, r.phone, r.company, r.quantity, r.budget, r.message]));
}
