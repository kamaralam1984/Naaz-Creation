"use client";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Field, Notice } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { FormState } from "@/server/account";

export function Submit({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending} className={className}>{pending ? "Please wait…" : children}</Button>;
}

type Action = (s: FormState, fd: FormData) => Promise<FormState>;
const init: FormState = {};

export function FormMessages({ s }: { s: FormState }) {
  if (s.ok && s.message) return <Notice tone="success">{s.message}</Notice>;
  if (s.error && !s.fieldErrors) return <Notice tone="error">{s.error}</Notice>;
  if (s.error && s.fieldErrors && !Object.keys(s.fieldErrors).length) return <Notice tone="error">{s.error}</Notice>;
  return null;
}

export function LoginForm({ action, next }: { action: Action; next?: string }) {
  const [s, a] = useActionState(action, init);
  return (
    <form action={a} className="space-y-5" noValidate>
      <FormMessages s={s} />
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required />
      <div className="flex items-center justify-between text-sm"><Link href="/forgot-password" className="link-underline">Forgot password?</Link></div>
      <Submit className="w-full">Sign in</Submit>
    </form>
  );
}

export function RegisterForm({ action, referral, next }: { action: Action; referral?: string; next?: string }) {
  const [s, a] = useActionState(action, init);
  const fe = s.fieldErrors ?? {};
  return (
    <form action={a} className="space-y-5" noValidate>
      <FormMessages s={s} />
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="Full name" name="name" autoComplete="name" required error={fe.name} />
      <Field label="Email" name="email" type="email" autoComplete="email" required error={fe.email} />
      <Field label="Mobile number" name="phone" type="tel" autoComplete="tel" error={fe.phone} hint="Optional — used only for delivery updates." />
      <Field label="Password" name="password" type="password" autoComplete="new-password" required error={fe.password} hint="At least 8 characters, with letters and numbers." />
      <Field label="Referral code" name="referral" defaultValue={referral} error={fe.referral} hint="Optional — you both earn loyalty points on your first order." />
      <Submit className="w-full">Create account</Submit>
    </form>
  );
}

export function ForgotForm({ action }: { action: Action }) {
  const [s, a] = useActionState(action, init);
  return (
    <form action={a} className="space-y-5" noValidate>
      <FormMessages s={s} />
      {!s.ok && <Field label="Email" name="email" type="email" autoComplete="email" required error={s.fieldErrors?.email} />}
      {!s.ok && <Submit className="w-full">Send reset link</Submit>}
    </form>
  );
}

export function ResetForm({ action, token }: { action: Action; token: string }) {
  const [s, a] = useActionState(action, init);
  const fe = s.fieldErrors ?? {};
  return (
    <form action={a} className="space-y-5" noValidate>
      <FormMessages s={s} />
      {s.ok ? <Button href="/login">Go to sign in</Button> : (
        <>
          <input type="hidden" name="token" value={token} />
          <Field label="New password" name="password" type="password" autoComplete="new-password" required error={fe.password} hint="At least 8 characters, with letters and numbers." />
          <Field label="Confirm password" name="confirm" type="password" autoComplete="new-password" required error={fe.confirm} />
          <Submit className="w-full">Update password</Submit>
        </>
      )}
    </form>
  );
}
