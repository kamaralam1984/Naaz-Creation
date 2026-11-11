import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { Prose } from "@/components/content/Prose";
import { getSettings } from "@/server/settings";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMeta({ title: "Terms & Conditions", description: "The terms that apply when you browse and buy from Nazi Creation.", path: "/legal/terms" });

export default function Terms() {
  const s = getSettings();
  return (
    <>
      <PageHero eyebrow="Legal" title="Terms & conditions" intro="Last updated: November 2026" />
      <Container className="py-16"><Prose>
        <p>By using this website and placing an order with {s.site_name}, you agree to the following terms.</p>
        <h2>Products and pricing</h2>
        <p>All prices are in Indian Rupees and inclusive of applicable GST unless stated. Our pieces are handmade, so small variations in colour, size and finish are normal. We may correct pricing or description errors and cancel affected orders with a full refund.</p>
        <h2>Orders and payment</h2>
        <p>An order is confirmed only after successful payment. Payments are processed securely by Razorpay. We reserve the right to cancel orders suspected of fraud or where stock is unavailable.</p>
        <h2>Shipping and delivery</h2>
        <p>Delivery timelines are estimates and may be affected by courier or weather delays. See our <a href="/help/shipping">shipping policy</a>.</p>
        <h2>Returns and refunds</h2>
        <p>Eligible items may be returned within {s.return_window_days} days of delivery under our <a href="/help/returns">returns policy</a>.</p>
        <h2>Gift cards, coupons and loyalty points</h2>
        <p>Gift cards are valid for 12 months and are non-refundable. Coupons and loyalty points have no cash value, cannot be combined unless stated, and may be withdrawn for misuse.</p>
        <h2>Accounts</h2>
        <p>You are responsible for keeping your credentials confidential and for activity under your account.</p>
        <h2>Intellectual property</h2>
        <p>Site content, imagery and branding belong to {s.site_name} or its artisans and may not be reused without permission.</p>
        <h2>Limitation of liability</h2>
        <p>To the extent permitted by law, our liability is limited to the value of the order concerned.</p>
        <h2>Governing law</h2>
        <p>These terms are governed by the laws of India, and courts at our registered location have exclusive jurisdiction.</p>
        <h2>Contact</h2>
        <p><a href={`mailto:${s.support_email}`}>{s.support_email}</a></p>
      </Prose></Container>
    </>
  );
}
