import Link from "next/link";
import { requirePerm } from "@/server/auth";
import { getSettings } from "@/server/settings";
import { mockEnabled, razorpayConfigured } from "@/server/payments";
import { siteUrl } from "@/server/email";
import { Notice } from "@/components/ui/Field";
import { PageHeader, Panel, btnCls, fieldCls, labelCls } from "@/components/admin/ui";
import { MarketingImageField } from "@/components/admin/MarketingFields";
import { one, type SP } from "@/server/admin-marketing";
import { saveSettings } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };
const TABS = [["website", "Website"], ["payments", "Payments"], ["shipping", "Shipping"], ["tax", "Tax"], ["currency", "Currency"], ["loyalty", "Loyalty & returns"], ["email", "Email"], ["social", "Social"]] as const;

function T({ name, label, v, hint, type = "text" }: { name: string; label: string; v: string; hint?: string; type?: string }) {
  return <div><label className={labelCls} htmlFor={name}>{label}</label><input id={name} name={name} type={type} defaultValue={v} className={fieldCls} />{hint && <p className="mt-1 text-xs text-charcoal/55">{hint}</p>}</div>;
}
function Check({ name, label, on }: { name: string; label: string; on: boolean }) {
  return <label className="flex items-center gap-2 text-sm"><input type="checkbox" name={name} value="1" defaultChecked={on} /> {label}</label>;
}
function Form({ group, children }: { group: string; children: React.ReactNode }) {
  return <form action={saveSettings}><input type="hidden" name="group" value={group} /><Panel className="grid max-w-3xl gap-4 sm:grid-cols-2">{children}</Panel><div className="mt-4"><button className={btnCls}>Save changes</button></div></form>;
}

export default async function Page({ searchParams }: { searchParams: SP }) {
  await requirePerm("settings", "/admin/settings");
  const sp = await searchParams;
  const tab = TABS.some(([k]) => k === one(sp.tab)) ? one(sp.tab) : "website";
  const s = getSettings();
  let rates = s.currency_rates;
  try { rates = JSON.stringify(JSON.parse(rates), null, 2); } catch {}
  const env = (k: string) => !!process.env[k];
  return (
    <>
      <PageHeader title="Settings" sub="Store configuration. Secrets live in environment variables, never here." />
      {one(sp.ok) && <div className="mb-4"><Notice tone="success">{one(sp.ok)}</Notice></div>}
      {one(sp.error) && <div className="mb-4"><Notice tone="error">{one(sp.error)}</Notice></div>}
      <nav className="mb-6 flex flex-wrap gap-2" aria-label="Settings sections">
        {TABS.map(([k, l]) => <Link key={k} href={`/admin/settings?tab=${k}`} aria-current={tab === k ? "page" : undefined} className={`inline-flex h-10 items-center border px-4 text-xs font-medium uppercase tracking-[0.14em] ${tab === k ? "border-charcoal bg-charcoal text-ivory" : "border-charcoal/30 hover:bg-charcoal/5"}`}>{l}</Link>)}
      </nav>

      {tab === "website" && <Form group="website">
        <T name="site_name" label="Site name" v={s.site_name} /><T name="support_email" label="Support email" v={s.support_email} type="email" />
        <T name="support_phone" label="Support phone" v={s.support_phone} /><T name="whatsapp_number" label="WhatsApp number (digits, with country code)" v={s.whatsapp_number} />
        <div className="sm:col-span-2"><MarketingImageField name="logo_url" label="Logo" initial={s.logo_url} /></div>
      </Form>}

      {tab === "payments" && <Panel className="max-w-3xl space-y-4 text-sm">
        <p>Mode: <strong>{razorpayConfigured() ? "Live — Razorpay" : mockEnabled() ? "Mock gateway (no keys set)" : "Payments unavailable (no keys; mock disabled)"}</strong></p>
        <ul className="space-y-1">{["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"].map((k) => <li key={k}><code>{k}</code> — {env(k) ? <span className="text-green-800">configured</span> : <span className="text-burgundy">not set</span>}</li>)}</ul>
        <div className="border-t border-charcoal/10 pt-4"><p className="font-medium">Setup</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-charcoal/80"><li>Add the three variables above to your hosting environment (or <code>.env.local</code>) and restart.</li><li>In the Razorpay dashboard, add a webhook pointing to <code className="break-all">{siteUrl()}/api/payments/webhook</code> with events <code>payment.captured</code>, <code>payment.failed</code>, <code>order.paid</code>, <code>refund.processed</code>.</li><li>Use the same secret in the dashboard and in <code>RAZORPAY_WEBHOOK_SECRET</code>.</li><li>Run a test payment in Razorpay test mode before switching to live keys.</li></ol></div>
        <p className="text-xs text-charcoal/60">Secrets are never shown or stored in the database.</p>
      </Panel>}

      {tab === "shipping" && <Form group="shipping">
        <T name="free_shipping_threshold" label="Free shipping above (₹)" v={s.free_shipping_threshold} type="number" /><T name="shipping_standard" label="Standard shipping (₹)" v={s.shipping_standard} type="number" />
        <T name="shipping_express" label="Express shipping (₹)" v={s.shipping_express} type="number" /><T name="shipping_international" label="International flat rate (₹)" v={s.shipping_international} type="number" />
        <T name="delivery_days_default" label="Default delivery days" v={s.delivery_days_default} type="number" /><T name="gift_wrap_fee" label="Gift-wrap fee (₹)" v={s.gift_wrap_fee} type="number" />
        <div className="sm:col-span-2"><Check name="international_enabled" label="Ship internationally" on={s.international_enabled === "1"} /></div>
      </Form>}

      {tab === "tax" && <Form group="tax">
        <T name="tax_rate" label="GST / tax rate (%)" v={s.tax_rate} type="number" />
        <div className="flex items-end"><Check name="tax_inclusive" label="Prices already include tax" on={s.tax_inclusive === "1"} /></div>
      </Form>}

      {tab === "currency" && <form action={saveSettings}><input type="hidden" name="group" value="currency" />
        <Panel className="max-w-3xl"><label className={labelCls} htmlFor="currency_rates">Display rates (1 INR = …), JSON</label>
          <textarea id="currency_rates" name="currency_rates" rows={8} defaultValue={rates} className={fieldCls + " h-auto py-2 font-mono"} />
          <p className="mt-1 text-xs text-charcoal/55">Used only for display; all payments are charged in INR. INR must be 1.</p></Panel>
        <div className="mt-4"><button className={btnCls}>Save rates</button></div></form>}

      {tab === "loyalty" && <Form group="loyalty">
        <T name="loyalty_earn_per_100" label="Points earned per ₹100" v={s.loyalty_earn_per_100} type="number" /><T name="loyalty_point_value" label="Value of 1 point (₹)" v={s.loyalty_point_value} type="number" />
        <T name="loyalty_max_redeem_pct" label="Max % of order payable with points" v={s.loyalty_max_redeem_pct} type="number" /><T name="referral_reward_points" label="Referral reward (points, each)" v={s.referral_reward_points} type="number" />
        <T name="return_window_days" label="Return window (days after delivery)" v={s.return_window_days} type="number" />
      </Form>}

      {tab === "email" && <Form group="email">
        <div className="sm:col-span-2"><T name="email_from" label="From address" v={s.email_from} hint='Format: Name <address@yourdomain.com>. The domain must be verified in Resend.' /></div>
        <div className="text-sm sm:col-span-2"><p>Delivery: <strong>{process.env.RESEND_API_KEY ? "Live via Resend" : "Log only — set RESEND_API_KEY to send real email"}</strong></p></div>
      </Form>}

      {tab === "social" && <Form group="social">
        <T name="instagram" label="Instagram URL" v={s.instagram} /><T name="facebook" label="Facebook URL" v={s.facebook} /><T name="pinterest" label="Pinterest URL" v={s.pinterest} /><T name="youtube" label="YouTube URL" v={s.youtube} />
      </Form>}
    </>
  );
}
