"use server";
import { z } from "zod";
import { all, run } from "@/server/db";
import { requirePerm } from "@/server/auth";
import { emailLayout, sendEmail } from "@/server/email";
import { escapeHtml } from "@/server/security";
import { flag, flash, intOr, str } from "@/server/admin-marketing";

export async function subscriberOp(fd: FormData) {
  await requirePerm("marketing", "/admin/newsletter");
  const id = intOr(fd, "id"), op = str(fd, "op");
  if (op === "delete") run("DELETE FROM newsletter_subscribers WHERE id = ?", id);
  else if (op === "unsubscribe") run("UPDATE newsletter_subscribers SET subscribed = 0 WHERE id = ?", id);
  else if (op === "resubscribe") run("UPDATE newsletter_subscribers SET subscribed = 1 WHERE id = ?", id);
  flash("/admin/newsletter", "ok", "Subscriber updated");
}

const campaign = z.object({ subject: z.string().min(3, "Subject is required").max(150), body: z.string().min(10, "Write a message").max(20000) });

export async function sendCampaign(fd: FormData) {
  await requirePerm("marketing", "/admin/newsletter");
  const p = campaign.safeParse({ subject: str(fd, "subject"), body: str(fd, "body") });
  if (!p.success) flash("/admin/newsletter", "error", p.error.issues[0].message);
  if (!flag(fd, "confirm")) flash("/admin/newsletter", "error", "Tick the confirmation box to send.");
  const subs = all<{ email: string }>("SELECT email FROM newsletter_subscribers WHERE subscribed = 1 LIMIT 5000");
  if (!subs.length) flash("/admin/newsletter", "error", "No active subscribers.");
  // Plain text is escaped and paragraphs preserved; HTML is not accepted to keep sends safe.
  const html = p.data.body.split(/\n{2,}/).map((para) => `<p>${escapeHtml(para).replace(/\n/g, "<br>")}</p>`).join("");
  const wrapped = emailLayout(p.data.subject, html + `<p style="font-size:12px;color:#6b645a">You are receiving this because you subscribed to our newsletter. Reply to this email to unsubscribe.</p>`);
  for (const s of subs) await sendEmail(s.email, p.data.subject, wrapped);
  flash("/admin/newsletter", "ok", `Campaign queued for ${subs.length} subscriber${subs.length === 1 ? "" : "s"}`);
}
