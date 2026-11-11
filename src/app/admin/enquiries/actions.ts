"use server";
import { z } from "zod";
import { get, json, run } from "@/server/db";
import { getUser, requirePerm } from "@/server/auth";
import { flash, intOr, str } from "@/server/admin-marketing";

type Details = Record<string, unknown> & { notes?: { at: string; by: string; text: string }[] };
const STATUSES = ["new", "contacted", "quoted", "closed"] as const;

export async function setEnquiryStatus(fd: FormData) {
  await requirePerm("enquiries", "/admin/enquiries");
  const id = intOr(fd, "id");
  const s = z.enum(STATUSES).safeParse(str(fd, "status"));
  if (!s.success) flash(`/admin/enquiries/${id}`, "error", "Invalid status");
  run("UPDATE enquiries SET status = ? WHERE id = ?", s.data, id);
  flash(`/admin/enquiries/${id}`, "ok", `Marked ${s.data}`);
}

export async function addEnquiryNote(fd: FormData) {
  await requirePerm("enquiries", "/admin/enquiries");
  const u = await getUser();
  const id = intOr(fd, "id");
  const text = str(fd, "note").slice(0, 1000);
  if (!text) flash(`/admin/enquiries/${id}`, "error", "Write a note first");
  const row = get<{ details: string | null }>("SELECT details FROM enquiries WHERE id = ?", id);
  if (!row) flash("/admin/enquiries", "error", "Enquiry not found");
  const d = json<Details>(row.details, {});
  d.notes = [...(d.notes ?? []), { at: new Date().toISOString(), by: u?.name ?? "staff", text }];
  run("UPDATE enquiries SET details = ? WHERE id = ?", JSON.stringify(d), id);
  flash(`/admin/enquiries/${id}`, "ok", "Note added");
}
