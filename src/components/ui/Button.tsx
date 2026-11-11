import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "gold" | "outline" | "ghost";
type Size = "md" | "lg";

const base =
  "group relative inline-flex before:pointer-events-none before:absolute before:inset-y-0 before:-left-1/2 before:w-1/3 before:skew-x-[-22deg] before:bg-white/35 before:opacity-0 hover:before:left-[120%] hover:before:opacity-100 before:transition-all before:duration-[900ms] before:ease-[var(--ease-luxe)] items-center justify-center gap-2 overflow-hidden font-sans text-[0.78rem] font-medium uppercase tracking-[0.2em] transition-colors duration-[400ms] ease-[var(--ease-luxe)] disabled:opacity-50 disabled:pointer-events-none";
const variants: Record<Variant, string> = {
  primary: "bg-burgundy text-ivory hover:bg-charcoal",
  gold: "bg-champagne text-charcoal hover:bg-charcoal hover:text-ivory",
  outline: "border border-charcoal text-charcoal hover:bg-charcoal hover:text-ivory",
  ghost: "text-charcoal hover:text-burgundy",
};
const sizes: Record<Size, string> = { md: "h-12 px-7", lg: "h-14 px-10" };

type Props = { variant?: Variant; size?: Size; className?: string; children: React.ReactNode } & (
  | ({ href: string } & Omit<React.ComponentProps<typeof Link>, "href" | "className" | "children">)
  | ({ href?: undefined } & React.ButtonHTMLAttributes<HTMLButtonElement>)
);

export function Button({ variant = "primary", size = "md", className, children, ...rest }: Props) {
  const cls = cn(base, variants[variant], sizes[size], className);
  if ("href" in rest && rest.href !== undefined) {
    const { href, ...linkProps } = rest;
    return <Link href={href} className={cls} {...linkProps}>{children}</Link>;
  }
  return <button className={cls} {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{children}</button>;
}
