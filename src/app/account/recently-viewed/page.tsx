import type { Metadata } from "next";
import { requireUser } from "@/server/auth";
import { recentlyViewedProducts } from "@/server/catalog";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Recently viewed" };
export const dynamic = "force-dynamic";

export default async function RecentPage() {
  const user = await requireUser("/account/recently-viewed");
  const items = recentlyViewedProducts(user.id, 12);
  return (
    <div>
      <h2 className="font-serif text-3xl">Recently viewed</h2>
      {items.length === 0 ? (
        <div className="mt-8 border border-dashed border-charcoal/25 p-12 text-center"><p className="font-serif text-2xl">Nothing here yet</p><p className="mt-2 text-sm text-charcoal/70">Pieces you look at will appear here.</p><Button href="/shop" className="mt-6">Start browsing</Button></div>
      ) : <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 xl:grid-cols-3">{items.map((p) => <li key={p.id}><ProductCard p={p} /></li>)}</ul>}
    </div>
  );
}
