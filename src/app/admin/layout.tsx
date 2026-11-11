import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser, can, type Perm } from "@/server/auth";
import { sweepExpiredOrders } from "@/server/orders";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const NAV: { label: string; href: string; perm: Perm; group: string }[] = [
  { label: "Dashboard", href: "/admin", perm: "dashboard", group: "Overview" },
  { label: "Orders", href: "/admin/orders", perm: "orders", group: "Sales" },
  { label: "Returns & refunds", href: "/admin/returns", perm: "returns", group: "Sales" },
  { label: "Products", href: "/admin/products", perm: "products", group: "Catalog" },
  { label: "Collections", href: "/admin/collections", perm: "marketing", group: "Catalog" },
  { label: "Reviews", href: "/admin/reviews", perm: "reviews", group: "Catalog" },
  { label: "Customers", href: "/admin/customers", perm: "customers", group: "People" },
  { label: "Enquiries", href: "/admin/enquiries", perm: "enquiries", group: "People" },
  { label: "Newsletter", href: "/admin/newsletter", perm: "marketing", group: "People" },
  { label: "Coupons", href: "/admin/coupons", perm: "marketing", group: "Marketing" },
  { label: "Banners & homepage", href: "/admin/banners", perm: "marketing", group: "Marketing" },
  { label: "Abandoned carts", href: "/admin/abandoned-carts", perm: "marketing", group: "Marketing" },
  { label: "Settings", href: "/admin/settings", perm: "settings", group: "System" },
  { label: "Staff & roles", href: "/admin/staff", perm: "staff", group: "System" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role === "customer") redirect("/");
  sweepExpiredOrders();
  const items = NAV.filter((n) => can(user, n.perm));
  return (
    <div className="min-h-screen bg-[#f3efe7] text-charcoal lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-charcoal/10 bg-charcoal text-ivory lg:min-h-screen lg:border-b-0">
        <div className="flex items-center justify-between p-5 lg:block">
          <Link href="/admin" className="font-serif text-xl uppercase tracking-[0.12em]">Nazi <span className="text-champagne">Admin</span></Link>
          <p className="mt-1 hidden text-xs text-ivory/60 lg:block">{user.name} · {user.role}</p>
        </div>
        <AdminNav items={items} />
        <div className="hidden space-y-1 border-t border-ivory/10 p-5 text-xs lg:block">
          <Link href="/" className="block text-ivory/70 hover:text-ivory">← View storefront</Link>
          <form action="/api/auth/logout" method="post"><button className="text-ivory/70 hover:text-ivory">Sign out</button></form>
        </div>
      </aside>
      <div className="min-w-0 p-5 lg:p-10">{children}</div>
    </div>
  );
}
