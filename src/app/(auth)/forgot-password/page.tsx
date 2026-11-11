import type { Metadata } from "next";
import Link from "next/link";
import { ForgotForm } from "@/components/account/Forms";
import { forgotAction } from "../actions";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false } };

export default function ForgotPage() {
  return (
    <>
      <p className="eyebrow">Account recovery</p>
      <h1 className="mt-2 text-4xl">Forgot password</h1>
      <p className="mt-3 text-sm text-charcoal/70">Enter your email and we&apos;ll send a link to choose a new password.</p>
      <div className="mt-8"><ForgotForm action={forgotAction} /></div>
      <p className="mt-8 text-sm"><Link href="/login" className="link-underline">← Back to sign in</Link></p>
    </>
  );
}
