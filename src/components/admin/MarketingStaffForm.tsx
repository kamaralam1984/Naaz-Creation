"use client";
import { useActionState } from "react";
import { createStaff, type CreateState } from "@/app/admin/staff/actions";
import { Notice } from "@/components/ui/Field";
import { btnCls, fieldCls, labelCls } from "@/components/admin/ui";

export function MarketingStaffForm() {
  const [state, action, pending] = useActionState<CreateState, FormData>(createStaff, null);
  return (
    <form action={action} className="space-y-4">
      {state?.error && <Notice tone="error">{state.error}</Notice>}
      {state?.created && (
        <Notice tone="success">
          Account created for <strong>{state.created.email}</strong>. Temporary password (shown once — share it securely):
          <code className="mt-1 block select-all bg-white px-2 py-1 font-mono">{state.created.password}</code>
        </Notice>
      )}
      <div><label className={labelCls} htmlFor="s-name">Full name</label><input id="s-name" name="name" required className={fieldCls} /></div>
      <div><label className={labelCls} htmlFor="s-email">Email</label><input id="s-email" name="email" type="email" required className={fieldCls} /></div>
      <div><label className={labelCls} htmlFor="s-role">Role</label><select id="s-role" name="role" defaultValue="staff" className={fieldCls}><option value="staff">Staff (products, orders, returns, reviews, enquiries)</option><option value="admin">Admin (everything)</option></select></div>
      <button className={btnCls} disabled={pending}>{pending ? "Creating…" : "Create account"}</button>
    </form>
  );
}
