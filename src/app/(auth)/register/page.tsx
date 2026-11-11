import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/server/auth";
import { safeNext } from "@/server/account";
import { RegisterForm } from "@/components/account/Forms";
import { registerAction } from "../actions";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const sp = await searchParams;
  if (await getUser()) redirect("/account");
  const ref = typeof sp.ref === "string" ? sp.ref.slice(0, 20) : undefined;
  const next = typeof sp.next === "string" ? safeNext(sp.next, "") : "";
  return (
    <>
      <p className="eyebrow">Join the house</p>
      <h1 className="mt-2 text-4xl">Create account</h1>
      <p className="mt-3 text-sm text-charcoal/70">Track orders, save favourites and earn loyalty points.</p>
      <div className="mt-8"><RegisterForm action={registerAction} referral={ref} next={next || undefined} /></div>
      <p className="mt-8 text-sm text-charcoal/70">Already have an account? <Link href="/login" className="link-underline text-charcoal">Sign in</Link></p>
    </>
  );
}
