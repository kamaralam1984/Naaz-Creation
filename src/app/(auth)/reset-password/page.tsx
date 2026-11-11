import type { Metadata } from "next";
import Link from "next/link";
import { ResetForm } from "@/components/account/Forms";
import { Notice } from "@/components/ui/Field";
import { resetAction } from "../actions";

export const metadata: Metadata = { title: "Reset password", robots: { index: false } };

export default async function ResetPage({ searchParams }: PageProps<"/reset-password">) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  return (
    <>
      <p className="eyebrow">Account recovery</p>
      <h1 className="mt-2 text-4xl">Choose a new password</h1>
      <div className="mt-8">
        {token ? <ResetForm action={resetAction} token={token} /> : <Notice tone="error">This reset link is missing its token. <Link href="/forgot-password" className="underline">Request a new one</Link>.</Notice>}
      </div>
    </>
  );
}
