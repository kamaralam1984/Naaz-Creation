"use client";
/** Submit button that asks for confirmation first. Pass formAction to target a different server action. */
export function ConfirmButton({ message, className, children, formAction }: { message: string; className?: string; children: React.ReactNode; formAction?: (fd: FormData) => void | Promise<void> }) {
  return <button formAction={formAction} formNoValidate className={className} onClick={(e) => { if (!confirm(message)) e.preventDefault(); }}>{children}</button>;
}

export function PrintButton({ className }: { className?: string }) {
  return <button type="button" className={className} onClick={() => window.print()}>Print</button>;
}
