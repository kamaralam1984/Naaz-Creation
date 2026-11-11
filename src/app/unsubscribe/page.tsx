import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { unsubscribe, verifyUnsubToken } from "@/server/content";
import { emailSchema } from "@/server/security";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false, follow: false } };

export default async function Unsubscribe({ searchParams }: { searchParams: Promise<{ email?: string; token?: string }> }) {
  const { email = "", token = "" } = await searchParams;
  const e = emailSchema.safeParse(email);
  const ok = e.success && token.length > 0 && verifyUnsubToken(e.data, token);
  if (ok) unsubscribe(e.data!);
  return (
    <Container className="max-w-xl py-28 text-center">
      <h1 className="font-serif text-5xl">{ok ? "You've been unsubscribed" : "This link isn't valid"}</h1>
      <p className="mt-5 text-charcoal/75">{ok ? "You won't receive our newsletter any more. Order emails will still reach you." : "The unsubscribe link is incomplete or has expired. Reply to any of our emails and we'll remove you by hand."}</p>
      <Button href="/" className="mt-10">Back to the house</Button>
    </Container>
  );
}
