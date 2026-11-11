import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { AccountNav } from "@/components/account/AccountNav";
import { requireUser } from "@/server/auth";

export const metadata: Metadata = { title: { default: "My account", template: "%s · My account" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/account");
  return (
    <Container className="py-12 lg:py-16">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow">My account</p><h1 className="mt-2 text-[length:var(--text-h2)]">Hello, {user.name.split(" ")[0]}</h1></div>
        <form action="/api/auth/logout" method="post"><button className="link-underline text-xs uppercase tracking-[0.2em]">Sign out</button></form>
      </header>
      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
