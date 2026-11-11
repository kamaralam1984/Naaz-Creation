import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePerm } from "@/server/auth";
import { all } from "@/server/db";
import { getArtisans, getCategories, getCollections, getProductById, getVariants } from "@/server/catalog";
import { PageHeader, btnDanger } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { ProductForm, type ProductFormData } from "@/components/admin/ProductForm";
import { deleteProduct, saveProduct } from "../actions";

export const dynamic = "force-dynamic";
// node:sqlite rows have null prototypes — pass plain objects to client components.
const opt = (r: { id: number; name: string }) => ({ id: r.id, name: r.name });

export default async function EditProduct({ params }: PageProps<"/admin/products/[id]">) {
  await requirePerm("products");
  const id = Number((await params).id);
  const p = Number.isInteger(id) ? getProductById(id) : null;
  if (!p) notFound();
  const initial: ProductFormData = {
    id: p.id, name: p.name, slug: p.slug, description: p.description, category_id: p.category_id, artisan_id: p.artisan_id, craft: p.craft ?? "", material: p.material ?? "",
    colors: p.colors.join(", "), dimensions: p.dimensions ?? "", weight_g: p.weight_g, care: p.care ?? "", sku: p.sku, price: p.has_variants ? (all<{ price: number }>("SELECT price FROM products WHERE id = ?", p.id)[0]?.price ?? p.price) : p.price,
    compare_at: p.compare_at, stock: p.stock, low_stock_threshold: p.low_stock_threshold, badge: p.badge ?? "", tone: p.tone, alt_tone: p.alt_tone, video_url: p.video_url ?? "",
    seo_title: p.seo_title ?? "", seo_description: p.seo_description ?? "", is_featured: !!p.is_featured, is_active: !!p.is_active, images: p.images, specs: p.specs,
    variants: getVariants(p.id).map((v) => ({ id: v.id, label: v.label, sku: v.sku ?? "", price: v.price, stock: v.stock })),
    collections: all<{ collection_id: number }>("SELECT collection_id FROM product_collections WHERE product_id = ?", p.id).map((r) => r.collection_id), kind: p.kind,
  };
  return (
    <>
      <PageHeader title={p.name} sub={p.kind === "giftcard" ? "Gift card product — type can't be changed or deleted" : `SKU ${p.sku}`}
        actions={<><Link href={`/product/${p.slug}`} className="link-underline text-xs uppercase tracking-[0.16em]" target="_blank">View in store ↗</Link><Link href="/admin/products" className="link-underline text-xs uppercase tracking-[0.16em]">← All products</Link></>} />
      <ProductForm initial={initial} categories={getCategories().map(opt)} artisans={getArtisans().map(opt)} collections={getCollections().map(opt)} action={saveProduct}
        onDeleteSlot={p.kind === "giftcard" ? null : <ConfirmButton formAction={deleteProduct} className={btnDanger} message="Delete this product? Products with past orders are hidden instead.">Delete product</ConfirmButton>} />
    </>
  );
}
