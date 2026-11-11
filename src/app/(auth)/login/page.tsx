import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/server/auth";
import { safeNext } from "@/server/account";
import { LoginForm } from "@/components/account/Forms";
import { loginAction } from "../actions";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? safeNext(sp.next, "") : "";
  const u = await getUser();
  if (u) redirect(next || (u.role === "customer" ? "/account" : "/admin"));
  return (
    <>
      <p className="eyebrow">Welcome back</p>
      <h1 className="mt-2 text-4xl">Sign in</h1>
      <div className="mt-8"><LoginForm action={loginAction} next={next || undefined} /></div>
      <p className="mt-8 text-sm text-charcoal/70">New to Naaz Creation? <Link href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"} className="link-underline text-charcoal">Create an account</Link></p>
    </>
  );
}
