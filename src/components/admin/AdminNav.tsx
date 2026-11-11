"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function AdminNav({ items }: { items: { label: string; href: string; group: string }[] }) {
  const path = usePathname();
  const groups = [...new Set(items.map((i) => i.group))];
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:overflow-visible lg:px-3 lg:pb-0">
      {groups.map((g) => (
        <div key={g} className="flex gap-1 lg:mb-4 lg:block">
          <p className="hidden px-3 pb-1 text-[0.62rem] uppercase tracking-[0.24em] text-ivory/45 lg:block">{g}</p>
          {items.filter((i) => i.group === g).map((i) => {
            const active = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
            return <Link key={i.href} href={i.href} aria-current={active ? "page" : undefined} className={cn("block whitespace-nowrap px-3 py-2 text-sm transition-colors", active ? "bg-ivory/12 text-champagne" : "text-ivory/80 hover:bg-ivory/8 hover:text-ivory")}>{i.label}</Link>;
          })}
        </div>
      ))}
    </nav>
  );
}
