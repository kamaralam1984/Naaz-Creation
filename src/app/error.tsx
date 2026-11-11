"use client";
/* eslint-disable react/no-unescaped-entities */
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

/** Never renders error.message — details stay in server logs. */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Container className="py-28 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-4 font-serif text-[length:var(--text-h1)]">We dropped something.</h1>
      <p className="mx-auto mt-5 max-w-md text-charcoal/75">An unexpected error occurred. Please try again — if it keeps happening, contact us and we'll sort it out.</p>
      <div className="mt-10 flex flex-wrap justify-center gap-4"><Button onClick={reset} size="lg">Try again</Button><Button href="/contact" variant="outline" size="lg">Contact us</Button></div>
    </Container>
  );
}
