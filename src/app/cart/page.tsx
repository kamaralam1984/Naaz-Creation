import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = { title: "Your Bag", robots: { index: false, follow: false } };

export default function CartPage() {
  return (
    <Container className="py-12 lg:py-20">
      <p className="eyebrow">Shopping bag</p>
      <h1 className="mt-3 text-[length:var(--text-h1)]">Your bag</h1>
      <CartView />
    </Container>
  );
}
