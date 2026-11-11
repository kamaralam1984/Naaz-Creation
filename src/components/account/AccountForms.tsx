"use client";
import { useActionState, useState } from "react";
import { Field, Notice, inputCls, selectCls, textareaCls } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { FormMessages, Submit } from "@/components/account/Forms";
import type { Address } from "@/server/types";
import type { FormState } from "@/server/account";

type Action = (s: FormState, fd: FormData) => Promise<FormState>;
const init: FormState = {};

export function CopyButton({ text, label = "Copy link" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return <Button type="button" variant="outline" onClick={() => { navigator.clipboard?.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 2000); }).catch(() => {}); }}>{done ? "Copied" : label}</Button>;
}

export function ProfileForm({ action, name, phone, email }: { action: Action; name: string; phone: string; email: string }) {
  const [s, a] = useActionState(action, init);
  const f = s.fieldErrors ?? {};
  return (
    <form action={a} className="grid gap-5 sm:grid-cols-2" noValidate>
      <div className="sm:col-span-2"><FormMessages s={s} /></div>
      <Field label="Full name" name="name" defaultValue={name} required error={f.name} />
      <Field label="Mobile number" name="phone" type="tel" defaultValue={phone} error={f.phone} />
      <Field label="Email" name="email_ro" defaultValue={email} readOnly disabled hint="Contact support to change your email." className="sm:col-span-2" />
      <div className="sm:col-span-2"><Submit>Save changes</Submit></div>
    </form>
  );
}

export function PasswordForm({ action }: { action: Action }) {
  const [s, a] = useActionState(action, init);
  const f = s.fieldErrors ?? {};
  return (
    <form action={a} className="max-w-md space-y-5" noValidate key={s.ok ? "done" : "form"}>
      <FormMessages s={s} />
      <Field label="Current password" name="current" type="password" autoComplete="current-password" required error={f.current} />
      <Field label="New password" name="next" type="password" autoComplete="new-password" required error={f.next} hint="At least 8 characters, with letters and numbers." />
      <Field label="Confirm new password" name="confirm" type="password" autoComplete="new-password" required error={f.confirm} />
      <Submit>Change password</Submit>
    </form>
  );
}

export function AddressForm({ action, initial, cancelHref }: { action: Action; initial?: Address; cancelHref?: string }) {
  const [s, a] = useActionState(action, init);
  const f = s.fieldErrors ?? {};
  return (
    <form action={a} className="grid gap-5 sm:grid-cols-2" noValidate key={s.ok ? "saved" : "form"}>
      <div className="sm:col-span-2"><FormMessages s={s} />{s.error && Object.keys(f).length > 0 && <Notice tone="error">{s.error}</Notice>}</div>
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <Field label="Label" name="label" defaultValue={initial?.label ?? ""} placeholder="Home, Office…" error={f.label} />
      <Field label="Full name" name="name" defaultValue={initial?.name} autoComplete="name" required error={f.name} />
      <Field label="Mobile number" name="phone" type="tel" defaultValue={initial?.phone} autoComplete="tel" required error={f.phone} />
      <Field label="PIN / postal code" name="pincode" defaultValue={initial?.pincode} autoComplete="postal-code" required error={f.pincode} />
      <Field label="Address line 1" name="line1" defaultValue={initial?.line1} autoComplete="address-line1" required error={f.line1} className="sm:col-span-2" />
      <Field label="Address line 2" name="line2" defaultValue={initial?.line2 ?? ""} autoComplete="address-line2" error={f.line2} className="sm:col-span-2" />
      <Field label="City" name="city" defaultValue={initial?.city} autoComplete="address-level2" required error={f.city} />
      <Field label="State" name="state" defaultValue={initial?.state} autoComplete="address-level1" required error={f.state} />
      <Field label="Country" name="country" defaultValue={initial?.country ?? "India"} autoComplete="country-name" required error={f.country} />
      <label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" name="is_default" defaultChecked={!!initial?.is_default} className="h-4 w-4 accent-[#572e35]" /> Make this my default address</label>
      <div className="flex gap-3 sm:col-span-2"><Submit>{initial ? "Save address" : "Add address"}</Submit>{cancelHref && <Button href={cancelHref} variant="ghost">Cancel</Button>}</div>
    </form>
  );
}

const REASONS = ["Item arrived damaged", "Not as described", "Wrong item received", "Changed my mind", "Quality not as expected"];
export function ReturnForm({ action, order, itemId }: { action: Action; order: string; itemId: number }) {
  const [s, a] = useActionState(action, init);
  const [open, setOpen] = useState(false);
  if (s.ok) return <Notice tone="success">{s.message}</Notice>;
  if (!open) return <button onClick={() => setOpen(true)} className="link-underline text-xs uppercase tracking-[0.16em]">Request return</button>;
  return (
    <form action={a} className="mt-3 space-y-3 border border-charcoal/15 bg-beige/40 p-4">
      <FormMessages s={s} />
      <input type="hidden" name="order" value={order} /><input type="hidden" name="item" value={itemId} />
      <label className="block text-xs uppercase tracking-[0.14em]" htmlFor={`reason-${itemId}`}>Reason</label>
      <select id={`reason-${itemId}`} name="reason" required className={selectCls} defaultValue="">
        <option value="" disabled>Select a reason</option>{REASONS.map((r) => <option key={r}>{r}</option>)}
      </select>
      <label className="block text-xs uppercase tracking-[0.14em]" htmlFor={`details-${itemId}`}>Details (optional)</label>
      <textarea id={`details-${itemId}`} name="details" maxLength={500} className={textareaCls} />
      <div className="flex gap-3"><Submit>Submit request</Submit><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button></div>
    </form>
  );
}
export { inputCls };
