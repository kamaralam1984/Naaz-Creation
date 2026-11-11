import { cn } from "@/lib/cn";
export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("bg-beige/60 transition-shadow duration-[400ms] ease-[var(--ease-luxe)] hover:shadow-[var(--shadow-lift)]", className)} {...p} />;
}
