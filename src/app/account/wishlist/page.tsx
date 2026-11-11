import type { Metadata } from "next";
import { requireUser } from "@/server/auth";
import { wishlistProducts } from "@/server/catalog";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Wishlist" };
export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const user = await requireUser("/account/wishlist");
  const items = wishlistProducts(user.id);
  return (
    <div>
      <h2 className="font-serif text-3xl">Wishlist</h2>
      {items.length === 0 ? (
        <div className="mt-8 border border-dashed border-charcoal/25 p-12 text-center"><p className="font-serif text-2xl">Nothing saved yet</p><p className="mt-2 text-sm text-charcoal/70">Tap the heart on any piece to keep it here.</p><Button href="/shop" className="mt-6">Explore the collection</Button></div>
      ) : <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 xl:grid-cols-3">{items.map((p) => <li key={p.id}><ProductCard p={p} /></li>)}</ul>}
    </div>
  );
}
