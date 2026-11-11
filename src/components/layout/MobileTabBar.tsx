"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, LayoutGrid, ShoppingBag, User } from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import { cn } from "@/lib/cn";

/** App-style bottom navigation, phones only. */
export function MobileTabBar() {
  const path = usePathname();
  const { user, cartCount, wishlist, openDrawer } = useStore();
  if (path.startsWith("/admin") || path.startsWith("/checkout")) return null;
  const items = [
    { label: "Home", href: "/", icon: Home, on: path === "/" },
    { label: "Shop", href: "/shop", icon: LayoutGrid, on: path.startsWith("/shop") || path.startsWith("/category") || path.startsWith("/collections") || path.startsWith("/product") },
    { label: "Wishlist", href: "/account/wishlist", icon: Heart, on: path.startsWith("/account/wishlist"), badge: wishlist.length },
    { label: "Bag", href: "/cart", icon: ShoppingBag, on: path.startsWith("/cart"), badge: cartCount, action: openDrawer },
    { label: user ? "Account" : "Sign in", href: user ? "/account" : "/login", icon: User, on: (path.startsWith("/account") && !path.startsWith("/account/wishlist")) || path.startsWith("/login") },
  ];
  return (
    <nav aria-label="App navigation" className="fixed inset-x-0 bottom-0 z-[58] border-t border-champagne/40 bg-[color-mix(in_srgb,var(--header-bg)_94%,transparent)] pb-[env(safe-area-inset-bottom)] text-[color:var(--header-fg)] shadow-[0_-10px_30px_-12px_rgb(0_0_0/0.35)] backdrop-blur-xl lg:hidden">
      <ul className="grid grid-cols-5">
        {items.map(({ label, href, icon: Icon, on, badge, action }) => (
          <li key={label}>
            <Link href={href} onClick={action ? (e) => { e.preventDefault(); action(); } : undefined} aria-current={on ? "page" : undefined}
              className={cn("relative flex h-14 flex-col items-center justify-center gap-0.5 text-[0.62rem] font-medium tracking-wide transition-colors active:scale-95", on ? "text-champagne" : "opacity-80")}>
              {on && <span aria-hidden className="gold-line absolute inset-x-5 top-0 h-[2px]" />}
              <span className="relative"><Icon size={21} strokeWidth={on ? 2.2 : 1.7} aria-hidden />
                {!!badge && <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-champagne px-1 text-[0.58rem] font-semibold text-charcoal">{badge}</span>}
              </span>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
