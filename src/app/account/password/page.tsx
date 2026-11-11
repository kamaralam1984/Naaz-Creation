import type { Metadata } from "next";
import { requireUser } from "@/server/auth";
import { PasswordForm } from "@/components/account/AccountForms";
import { changePasswordAction } from "../actions";

export const metadata: Metadata = { title: "Change password" };
export const dynamic = "force-dynamic";

export default async function PasswordPage() {
  await requireUser("/account/password");
  return (
    <div>
      <h2 className="font-serif text-3xl">Change password</h2>
      <div className="mt-6"><PasswordForm action={changePasswordAction} /></div>
    </div>
  );
}
