import Link from "next/link";
import { requirePerm } from "@/server/auth";
import { getArtisans, getCategories, getCollections } from "@/server/catalog";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm, type ProductFormData } from "@/components/admin/ProductForm";
import { saveProduct } from "../actions";

export const dynamic = "force-dynamic";
// node:sqlite rows have null prototypes — pass plain objects to client components.
const opt = (r: { id: number; name: string }) => ({ id: r.id, name: r.name });
const EMPTY: ProductFormData = { id: 0, name: "", slug: "", description: "", category_id: null, artisan_id: null, craft: "", material: "", colors: "", dimensions: "", weight_g: null, care: "", sku: "", price: 0, compare_at: null, stock: 0, low_stock_threshold: 5, badge: "", tone: "sand", alt_tone: "clay", video_url: "", seo_title: "", seo_description: "", is_featured: false, is_active: true, images: [], specs: [], variants: [], collections: [], kind: "physical" };

export default async function NewProduct() {
  await requirePerm("products");
  return (
    <>
      <PageHeader title="New product" actions={<Link href="/admin/products" className="link-underline text-xs uppercase tracking-[0.16em]">← All products</Link>} />
      <ProductForm initial={EMPTY} categories={getCategories().map(opt)} artisans={getArtisans().map(opt)} collections={getCollections().map(opt)} action={saveProduct} />
    </>
  );
}
