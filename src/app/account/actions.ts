"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { changePassword, logActivity, requireUser } from "@/server/auth";
import { run } from "@/server/db";
import { getOrderByNumber, requestReturn } from "@/server/orders";
import { addressSchema, flat, passwordSchema, phoneSchema } from "@/server/security";
import { deleteAddress, saveAddress, setDefaultAddress, userAddress, type FormState } from "@/server/account";

const str = (fd: FormData, k: string) => (typeof fd.get(k) === "string" ? (fd.get(k) as string) : "");
const fe = (e: z.ZodError) => Object.fromEntries(e.issues.map((i) => [String(i.path[0]), i.message]));

export async function updateProfileAction(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser("/account");
  const p = z.object({ name: z.string().trim().min(2, "Enter your name").max(100), phone: z.union([phoneSchema, z.literal("")]) }).safeParse({ name: str(fd, "name"), phone: str(fd, "phone") });
  if (!p.success) return { error: flat(p.error), fieldErrors: fe(p.error) };
  run("UPDATE users SET name = ?, phone = ? WHERE id = ?", p.data.name, p.data.phone || null, u.id);
  logActivity(u.id, "profile_update");
  revalidatePath("/account");
  return { ok: true, message: "Profile updated." };
}

export async function changePasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser("/account/password");
  const next = passwordSchema.safeParse(str(fd, "next"));
  if (!next.success) return { error: flat(next.error), fieldErrors: { next: flat(next.error) } };
  if (next.data !== str(fd, "confirm")) return { error: "Passwords don't match.", fieldErrors: { confirm: "Passwords don't match." } };
  if (!(await changePassword(u.id, str(fd, "current"), next.data))) return { error: "Your current password is incorrect.", fieldErrors: { current: "Incorrect password." } };
  return { ok: true, message: "Password changed." };
}

export async function saveAddressAction(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser("/account/addresses");
  const p = addressSchema.extend({ label: z.string().trim().max(40).optional() }).safeParse(Object.fromEntries(["label", "name", "phone", "line1", "line2", "city", "state", "pincode", "country"].map((k) => [k, str(fd, k) || undefined])));
  if (!p.success) return { error: flat(p.error), fieldErrors: fe(p.error) };
  const id = Number(str(fd, "id")) || null;
  if (id && !userAddress(u.id, id)) return { error: "Address not found." };
  saveAddress(u.id, id, p.data, str(fd, "is_default") === "on");
  revalidatePath("/account/addresses");
  return { ok: true, message: id ? "Address updated." : "Address added." };
}

export async function deleteAddressAction(fd: FormData) {
  const u = await requireUser("/account/addresses");
  const id = Number(str(fd, "id"));
  if (id) deleteAddress(u.id, id);
  revalidatePath("/account/addresses");
}
export async function defaultAddressAction(fd: FormData) {
  const u = await requireUser("/account/addresses");
  const id = Number(str(fd, "id"));
  if (id) setDefaultAddress(u.id, id);
  revalidatePath("/account/addresses");
}

export async function requestReturnAction(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser("/account/orders");
  const p = z.object({ reason: z.string().trim().min(3, "Choose a reason").max(120), details: z.string().trim().max(500).optional() }).safeParse({ reason: str(fd, "reason"), details: str(fd, "details") || undefined });
  if (!p.success) return { error: flat(p.error) };
  const order = getOrderByNumber(str(fd, "order"));
  if (!order || order.user_id !== u.id) return { error: "Order not found." };
  const r = requestReturn({ orderId: order.id, userId: u.id, itemId: Number(str(fd, "item")), reason: p.data.reason, details: p.data.details });
  if (!r.ok) return { error: r.error };
  revalidatePath(`/account/orders/${order.number}`);
  revalidatePath("/account/returns");
  return { ok: true, message: "Return requested. We'll email you once it's reviewed." };
}
