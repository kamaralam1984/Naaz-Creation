import { createHmac } from "node:crypto";
import { get, run } from "./db";
import { emailLayout, sendEmail, siteUrl } from "./email";
import { escapeHtml, safeEqual } from "./security";
import { getSetting } from "./settings";

const secret = () => process.env.NEWSLETTER_SECRET ?? `nl:${process.env.RAZORPAY_KEY_SECRET ?? "dev-secret"}`;
export const unsubToken = (email: string) => createHmac("sha256", secret()).update(email.toLowerCase()).digest("hex").slice(0, 32);
export const verifyUnsubToken = (email: string, t: string) => safeEqual(unsubToken(email), t);
export const unsubscribeUrl = (email: string) => `${siteUrl()}/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubToken(email)}`;

export async function subscribeNewsletter(email: string, source: string): Promise<"new" | "existing"> {
  const row = get<{ subscribed: number }>("SELECT subscribed FROM newsletter_subscribers WHERE email = ?", email);
  if (row?.subscribed) return "existing";
  run("INSERT INTO newsletter_subscribers(email, source) VALUES(?,?) ON CONFLICT(email) DO UPDATE SET subscribed = 1", email, source.slice(0, 40));
  await sendEmail(email, `Welcome to ${getSetting("site_name")}`, emailLayout("Welcome to the house", `<p>Thank you for subscribing. You'll hear from us about new pieces, artisan stories and quiet offers — never more than a couple of times a month.</p><p style="font-size:12px;color:#6b645a"><a href="${unsubscribeUrl(email)}">Unsubscribe</a> at any time.</p>`, { label: "Explore the collection", href: siteUrl() + "/shop" }));
  return "new";
}

export function unsubscribe(email: string) {
  return run("UPDATE newsletter_subscribers SET subscribed = 0 WHERE email = ?", email).changes > 0;
}

export type EnquiryInput = { type: "corporate" | "bulk" | "custom" | "contact"; name: string; email: string; phone?: string | null; company?: string | null; quantity?: number | null; budget?: string | null; message?: string | null; details?: Record<string, unknown> };

export async function createEnquiry(i: EnquiryInput): Promise<number> {
  const details = i.details ? JSON.stringify(i.details).slice(0, 4000) : null;
  const id = run("INSERT INTO enquiries(type,name,email,phone,company,quantity,budget,message,details) VALUES(?,?,?,?,?,?,?,?,?)", i.type, i.name, i.email, i.phone ?? null, i.company ?? null, i.quantity ?? null, i.budget ?? null, i.message ?? null, details).id;
  const label = { corporate: "corporate gifting", bulk: "bulk order", custom: "custom hamper", contact: "contact" }[i.type];
  await sendEmail(i.email, `We've received your ${label} enquiry`, emailLayout(`Thank you, ${i.name.split(" ")[0]}`, `<p>We've received your ${label} enquiry (ref #${id}) and a member of the team will reply within one working day.</p>${i.message ? `<p style="color:#6b645a"><em>“${escapeHtml(i.message.slice(0, 400))}”</em></p>` : ""}`));
  const rows = [["Type", label], ["Name", i.name], ["Email", i.email], ["Phone", i.phone], ["Company", i.company], ["Quantity", i.quantity], ["Budget", i.budget], ["Message", i.message], ["Details", details]]
    .filter(([, v]) => v != null && v !== "").map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0"><strong>${k}</strong></td><td>${escapeHtml(String(v))}</td></tr>`).join("");
  await sendEmail(getSetting("support_email"), `New ${label} enquiry #${id}`, emailLayout(`New ${label} enquiry`, `<table>${rows}</table>`, { label: "Open in admin", href: siteUrl() + "/admin/enquiries" }));
  return id;
}

export function giftCardBalance(code: string) {
  const g = get<{ balance: number; amount: number; status: string; expires_at: string | null }>("SELECT balance, amount, status, expires_at FROM gift_cards WHERE code = ?", code.trim().toUpperCase());
  if (!g) return null;
  const expired = !!g.expires_at && g.expires_at < new Date().toISOString();
  return { balance: g.balance, amount: g.amount, status: expired ? "expired" : g.status, expires_at: g.expires_at };
}
