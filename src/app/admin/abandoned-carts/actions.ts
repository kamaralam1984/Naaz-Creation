"use server";
import { requirePerm } from "@/server/auth";
import { sendAbandonedCartReminders } from "@/server/orders";
import { flash } from "@/server/admin-marketing";

export async function sendReminders() {
  await requirePerm("marketing", "/admin/abandoned-carts");
  const n = await sendAbandonedCartReminders(60);
  flash("/admin/abandoned-carts", "ok", n ? `Reminder sent to ${n} shopper${n === 1 ? "" : "s"}` : "No carts are due a reminder");
}
