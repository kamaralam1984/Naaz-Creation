"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const ITEMS = [
  ["Overview", "/account"], ["Orders", "/account/orders"], ["Wishlist", "/account/wishlist"], ["Recently viewed", "/account/recently-viewed"],
  ["Addresses", "/account/addresses"], ["Returns", "/account/returns"], ["Password", "/account/password"],
] as const;

export function AccountNav() {
  const path = usePathname();
  return (
    <nav aria-label="Account" className="-mx-5 flex gap-1 overflow-x-auto border-b border-charcoal/10 px-5 pb-0 lg:mx-0 lg:block lg:border-0 lg:px-0">
      {ITEMS.map(([label, href]) => {
        const active = href === "/account" ? path === href : path.startsWith(href);
        return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("block whitespace-nowrap border-b-2 px-3 py-3 text-sm transition-colors lg:border-b-0 lg:border-l-2 lg:py-2.5", active ? "border-burgundy font-medium text-burgundy" : "border-transparent text-charcoal/70 hover:text-charcoal")}>{label}</Link>;
      })}
    </nav>
  );
}
