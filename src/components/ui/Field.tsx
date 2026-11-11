import { cn } from "@/lib/cn";

const base = "w-full border border-charcoal/25 bg-transparent px-4 text-sm placeholder:text-charcoal/45 transition-colors focus:border-charcoal focus:outline-none disabled:opacity-50";

export function Field({ label, name, error, hint, className, children, ...rest }: { label: string; name: string; error?: string; hint?: string; className?: string; children?: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1.5 block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-charcoal/75">{label}{rest.required && <span aria-hidden className="text-burgundy"> *</span>}</label>
      {children ?? <input id={name} name={name} aria-invalid={!!error} aria-describedby={error ? `${name}-err` : hint ? `${name}-hint` : undefined} className={cn(base, "h-12", error && "border-burgundy")} {...rest} />}
      {hint && !error && <p id={`${name}-hint`} className="mt-1 text-xs text-charcoal/55">{hint}</p>}
      {error && <p id={`${name}-err`} role="alert" className="mt-1 text-xs text-burgundy">{error}</p>}
    </div>
  );
}
export const inputCls = cn(base, "h-12");
export const textareaCls = cn(base, "min-h-28 py-3");
export const selectCls = cn(base, "h-12 pr-8");

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "success"; children: React.ReactNode }) {
  const t = { info: "border-champagne-deep/40 bg-beige/60", error: "border-burgundy/40 bg-burgundy/5 text-burgundy", success: "border-green-800/30 bg-green-50 text-green-900" }[tone];
  return <div role={tone === "error" ? "alert" : "status"} className={cn("border px-4 py-3 text-sm", t)}>{children}</div>;
}
