"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePerm } from "@/server/auth";
import { refundOrder, updateOrderStatus } from "@/server/orders";
import { ORDER_STATUSES } from "@/server/types";

const back = (id: number, kind: "notice" | "err", msg: string): never => redirect(`/admin/orders/${id}?${kind}=${encodeURIComponent(msg)}`);
const idOf = (fd: FormData) => { const id = Number(fd.get("id")); if (!Number.isInteger(id) || id <= 0) redirect("/admin/orders"); return id; };

export async function updateStatusAction(fd: FormData) {
  await requirePerm("orders");
  const id = idOf(fd);
  const p = z.object({ status: z.enum(ORDER_STATUSES), note: z.string().trim().max(300).optional(), tracking: z.string().trim().max(80).optional(), carrier: z.string().trim().max(80).optional() })
    .safeParse({ status: fd.get("status"), note: fd.get("note") ?? "", tracking: fd.get("tracking") ?? "", carrier: fd.get("carrier") ?? "" });
  if (!p.success) return back(id, "err", "Choose a valid status.");
  const r = updateOrderStatus(id, p.data.status, { note: p.data.note || undefined, trackingNumber: p.data.tracking || undefined, carrier: p.data.carrier || undefined });
  return r.ok ? back(id, "notice", "Order updated and customer notified.") : back(id, "err", r.error);
}

export async function cancelOrderAction(fd: FormData) {
  await requirePerm("orders");
  const id = idOf(fd);
  const r = updateOrderStatus(id, "cancelled", { note: String(fd.get("note") ?? "Cancelled by staff").slice(0, 300) || "Cancelled by staff" });
  return r.ok ? back(id, "notice", "Order cancelled and stock released. Issue a refund if it was paid.") : back(id, "err", r.error);
}

export async function refundAction(fd: FormData) {
  await requirePerm("orders");
  const id = idOf(fd);
  const p = z.object({ amount: z.coerce.number().int().min(1), note: z.string().trim().max(300) }).safeParse({ amount: fd.get("amount"), note: fd.get("note") ?? "" });
  if (!p.success) return back(id, "err", "Enter a whole-rupee refund amount.");
  const r = await refundOrder(id, p.data.amount, p.data.note || "Refund issued by staff");
  return r.ok ? back(id, "notice", "Refund recorded.") : back(id, "err", r.error);
}
