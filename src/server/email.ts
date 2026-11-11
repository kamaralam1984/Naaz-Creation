import { run } from "./db";
import { getSetting } from "./settings";
import { escapeHtml } from "./security";

const SITE = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const siteUrl = SITE;

/** Branded transactional layout. */
export function emailLayout(title: string, bodyHtml: string, cta?: { label: string; href: string }) {
  const name = escapeHtml(getSetting("site_name"));
  return `<!doctype html><html><body style="margin:0;background:#f8f5ef;font-family:Georgia,serif;color:#26231f">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
  <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border:1px solid #eae2d5">
    <tr><td style="padding:28px 32px;border-bottom:1px solid #eae2d5;letter-spacing:.3em;text-transform:uppercase;font-size:14px">${name}</td></tr>
    <tr><td style="padding:32px"><h1 style="font-weight:500;font-size:26px;margin:0 0 16px">${escapeHtml(title)}</h1>
    <div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#26231f">${bodyHtml}</div>
    ${cta ? `<p style="margin:28px 0 0"><a href="${cta.href}" style="background:#572e35;color:#f8f5ef;text-decoration:none;padding:14px 28px;font:600 12px Arial;letter-spacing:.2em;text-transform:uppercase">${escapeHtml(cta.label)}</a></p>` : ""}
    </td></tr>
    <tr><td style="padding:20px 32px;background:#eae2d5;font:12px Arial;color:#5b554c">Handcrafted by India's master artisans · ${escapeHtml(getSetting("support_email"))}</td></tr>
  </table></td></tr></table></body></html>`;
}

/**
 * Queues the email in `email_outbox`. If RESEND_API_KEY is set it is delivered via Resend;
 * otherwise it is only logged (status "logged") so nothing breaks before keys are added.
 * Never throws.
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  let id = 0;
  try {
    id = run("INSERT INTO email_outbox(to_email, subject, body_html) VALUES(?,?,?)", to, subject, html).id;
    const key = process.env.RESEND_API_KEY;
    if (!key) { run("UPDATE email_outbox SET status='logged' WHERE id=?", id); return; }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM ?? getSetting("email_from"), to, subject, html }),
    });
    if (res.ok) run("UPDATE email_outbox SET status='sent' WHERE id=?", id);
    else run("UPDATE email_outbox SET status='failed', error=? WHERE id=?", (await res.text()).slice(0, 500), id);
  } catch (e) {
    try { if (id) run("UPDATE email_outbox SET status='failed', error=? WHERE id=?", String(e).slice(0, 500), id); } catch {}
  }
}
