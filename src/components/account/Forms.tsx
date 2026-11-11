"use client";
import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
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
  const ref = useRef<HTMLDivElement>(null);
  const show = (s.ok && s.message) || s.error;
  // After a failed submit the page can be scrolled far from the message (esp. on phones) — bring it into view.
  useEffect(() => { if (show) ref.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }, [s, show]);
  if (s.ok && s.message) return <div ref={ref}><Notice tone="success">{s.message}</Notice></div>;
  if (s.error) return <div ref={ref}><Notice tone="error">{s.error}</Notice></div>;
  return null;
}

export function LoginForm({ action, next }: { action: Action; next?: string }) {
  const [s, a] = useActionState(action, init);
  return (
    <form action={a} className="space-y-5" noValidate>
      <FormMessages s={s} />
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="Email" name="email" type="email" autoComplete="email" required defaultValue={s.values?.email} key={`e-${s.values?.email ?? ""}-${s.error ?? ""}`} />
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
      <Field label="Full name" name="name" autoComplete="name" required error={fe.name} defaultValue={s.values?.name} key={`n-${s.error ?? ""}`} />
      <Field label="Email" name="email" type="email" autoComplete="email" required error={fe.email} defaultValue={s.values?.email} key={`e-${s.error ?? ""}`} />
      <Field label="Mobile number" name="phone" type="tel" autoComplete="tel" error={fe.phone} defaultValue={s.values?.phone} key={`p-${s.error ?? ""}`} hint="Optional — used only for delivery updates." />
      <Field label="Password" name="password" type="password" autoComplete="new-password" required error={fe.password} hint="At least 8 characters, with letters and numbers." />
      <Field label="Referral code" name="referral" defaultValue={s.values?.referral ?? referral} key={`r-${s.error ?? ""}`} error={fe.referral} hint="Optional — you both earn loyalty points on your first order." />
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
