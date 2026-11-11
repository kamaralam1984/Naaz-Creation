import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { Prose } from "@/components/content/Prose";
import { getSettings } from "@/server/settings";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMeta({ title: "Privacy Policy", description: "How Nazi Creation collects, uses and protects your personal information.", path: "/legal/privacy" });

export default function Privacy() {
  const s = getSettings();
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy policy" intro="Last updated: November 2026" />
      <Container className="py-16"><Prose>
        <p>{s.site_name} (“we”, “us”) respects your privacy. This policy explains what we collect, why, and the choices you have, in line with the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023.</p>
        <h2>Information we collect</h2>
        <ul><li>Account and order details: name, email, phone number, delivery and billing addresses.</li><li>Payment status and references. Card, UPI and net-banking details are handled by our payment partner Razorpay and never stored on our servers.</li><li>Usage data such as pages viewed and cart contents, to run the store and recover abandoned carts.</li><li>Messages you send us and newsletter subscription preferences.</li></ul>
        <h2>How we use it</h2>
        <ul><li>To process and deliver orders, handle returns and provide support.</li><li>To send order and shipping notifications.</li><li>To send marketing email only if you subscribe; every email has an unsubscribe link.</li><li>To prevent fraud and keep the site secure.</li></ul>
        <h2>Sharing</h2>
        <p>We share data only with service providers needed to fulfil your order — payment processors, courier partners and email delivery services — and where required by law. We do not sell personal data.</p>
        <h2>Cookies and storage</h2>
        <p>We use a strictly necessary session cookie to keep you signed in, and browser storage to remember your bag, wishlist and display currency.</p>
        <h2>Retention and security</h2>
        <p>We keep order records for as long as needed for tax and legal obligations. Passwords are hashed, sessions are revocable, and access to administrative tools is restricted.</p>
        <h2>Your rights</h2>
        <p>You may access, correct or delete your personal data, or withdraw consent, by writing to <a href={`mailto:${s.support_email}`}>{s.support_email}</a>.</p>
        <h2>Contact</h2>
        <p>Questions about this policy: <a href={`mailto:${s.support_email}`}>{s.support_email}</a>.</p>
      </Prose></Container>
    </>
  );
}
