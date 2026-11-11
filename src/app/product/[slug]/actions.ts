"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUser } from "@/server/auth";
import { get, run } from "@/server/db";
import { clientIp, flat, rateLimit } from "@/server/security";

export type ReviewState = { ok?: boolean; error?: string };
const schema = z.object({
  productId: z.coerce.number().int().positive(), rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(100).optional(), body: z.string().trim().min(10, "Please write at least 10 characters").max(2000),
  name: z.string().trim().min(2, "Please add your name").max(60), website: z.string().max(0).optional(),
});

export async function submitReview(_: ReviewState, fd: FormData): Promise<ReviewState> {
  const p = schema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: flat(p.error) };
  if (!rateLimit(`review:${clientIp(await headers())}`, 5, 600_000).ok) return { error: "Too many reviews — please try again later." };
  const u = await getUser();
  if (!u) return { error: "Please sign in to write a review." };
  if (get("SELECT 1 FROM reviews WHERE product_id = ? AND user_id = ?", p.data.productId, u.id)) return { error: "You've already reviewed this piece." };
  const verified = !!get("SELECT 1 FROM orders o JOIN order_items i ON i.order_id = o.id WHERE o.user_id = ? AND i.product_id = ? AND o.payment_status IN ('paid','partially_refunded')", u.id, p.data.productId);
  run("INSERT INTO reviews(product_id, user_id, name, rating, title, body, status, verified) VALUES(?,?,?,?,?,?, 'pending', ?)", p.data.productId, u.id, p.data.name, p.data.rating, p.data.title || null, p.data.body, verified ? 1 : 0);
  const slug = get<{ slug: string }>("SELECT slug FROM products WHERE id = ?", p.data.productId)?.slug;
  if (slug) revalidatePath(`/product/${slug}`);
  return { ok: true };
}
