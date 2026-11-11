/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <Container className="py-28 text-center">
      <p className="eyebrow">Error 404</p>
      <h1 className="mt-4 font-serif text-[length:var(--text-h1)]">This piece has wandered off.</h1>
      <p className="mx-auto mt-5 max-w-md text-charcoal/75">The page you're looking for doesn't exist or has moved. Let's find you something beautiful instead.</p>
      <div className="mt-10 flex flex-wrap justify-center gap-4"><Button href="/shop" size="lg">Shop the collection</Button><Button href="/" variant="outline" size="lg">Go home</Button></div>
    </Container>
  );
}
