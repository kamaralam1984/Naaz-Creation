import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { getUser } from "@/server/auth";
import { all } from "@/server/db";
import { getSettings } from "@/server/settings";
import { mockEnabled, paymentsAvailable, razorpayConfigured } from "@/server/payments";
import type { Address } from "@/server/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

export default async function CheckoutPage() {
  const user = await getUser();
  const s = getSettings();
  const addresses = user ? all<Address>("SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC", user.id) : [];
  return (
    <Container className="py-10 lg:py-16">
      <p className="eyebrow">Secure checkout</p>
      <h1 className="mt-3 text-[length:var(--text-h1)]">Checkout</h1>
      <CheckoutForm
        user={user ? { name: user.name, email: user.email, phone: user.phone ?? "", points: user.loyalty_points } : null}
        addresses={addresses.map((a) => ({ id: a.id, label: a.label, name: a.name, phone: a.phone, line1: a.line1, line2: a.line2 ?? "", city: a.city, state: a.state, pincode: a.pincode, country: a.country }))}
        intl={s.international_enabled === "1"} giftWrapFee={Number(s.gift_wrap_fee)} pointValue={Number(s.loyalty_point_value)}
        payments={{ available: paymentsAvailable(), live: razorpayConfigured(), mock: mockEnabled() }}
      />
    </Container>
  );
}
