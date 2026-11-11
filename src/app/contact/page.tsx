import { Mail, MessageCircle, Phone } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { EnquiryForm } from "@/components/content/EnquiryForm";
import { getSettings } from "@/server/settings";
import { JsonLd, breadcrumbJsonLd, pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMeta({ title: "Contact Us", description: "Questions about an order, a piece or a custom request? Reach the Nazi Creation team by form, email, phone or WhatsApp.", path: "/contact" });

export default function Contact() {
  const s = getSettings();
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }])} />
      <PageHero eyebrow="Contact" title="We'd love to hear from you." intro="We reply within one working day, Monday to Saturday." />
      <Container className="grid gap-16 py-20 lg:grid-cols-[1fr_1.5fr]">
        <ul className="space-y-8">
          <li className="flex gap-4"><Mail size={22} strokeWidth={1.3} className="mt-1 text-champagne-deep" aria-hidden /><div><p className="eyebrow">Email</p><a className="font-serif text-2xl underline" href={`mailto:${s.support_email}`}>{s.support_email}</a></div></li>
          {s.support_phone && <li className="flex gap-4"><Phone size={22} strokeWidth={1.3} className="mt-1 text-champagne-deep" aria-hidden /><div><p className="eyebrow">Phone</p><a className="font-serif text-2xl" href={`tel:${s.support_phone.replace(/\s/g, "")}`}>{s.support_phone}</a><p className="text-xs text-charcoal/60">Mon–Sat, 10am–6pm IST</p></div></li>}
          {s.whatsapp_number && <li className="flex gap-4"><MessageCircle size={22} strokeWidth={1.3} className="mt-1 text-champagne-deep" aria-hidden /><div><p className="eyebrow">WhatsApp</p><a className="font-serif text-2xl underline" href={`https://wa.me/${s.whatsapp_number}`} target="_blank" rel="noopener noreferrer">Chat with us</a></div></li>}
        </ul>
        <div><h2 className="mb-6 font-serif text-3xl">Send a message</h2><EnquiryForm kind="contact" submitLabel="Send message" messageLabel="How can we help?" /></div>
      </Container>
    </>
  );
}
