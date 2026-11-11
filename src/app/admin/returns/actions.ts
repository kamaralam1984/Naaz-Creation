"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePerm } from "@/server/auth";
import { get } from "@/server/db";
import { setReturnStatus } from "@/server/orders";

const NEXT: Record<string, string[]> = { requested: ["approve", "reject"], approved: ["receive", "refund", "reject"], received: ["refund"], rejected: [], refunded: [] };
const TO = { approve: "approved", reject: "rejected", receive: "received", refund: "refunded" } as const;
const go = (kind: "notice" | "err", msg: string): never => redirect(`/admin/returns?${kind}=${encodeURIComponent(msg)}`);

export async function returnAction(fd: FormData) {
  await requirePerm("returns");
  const p = z.object({ id: z.coerce.number().int().positive(), intent: z.enum(["approve", "reject", "receive", "refund"]), amount: z.coerce.number().int().min(1).optional() })
    .safeParse({ id: fd.get("id"), intent: fd.get("intent"), amount: fd.get("amount") || undefined });
  if (!p.success) return go("err", "Invalid request.");
  const cur = get<{ status: string }>("SELECT status FROM returns WHERE id = ?", p.data.id);
  if (!cur) return go("err", "Return not found.");
  if (!NEXT[cur.status]?.includes(p.data.intent)) return go("err", `A ${cur.status} return can't be ${TO[p.data.intent]}.`);
  const r = await setReturnStatus(p.data.id, TO[p.data.intent], p.data.intent === "refund" ? p.data.amount : undefined);
  return r.ok ? go("notice", `Return #${p.data.id} ${TO[p.data.intent]}.`) : go("err", r.error);
}
