export type Role = "customer" | "staff" | "admin";
export type Tone = "clay" | "brass" | "wine" | "sand" | "ink";

export type User = {
  id: number; email: string; name: string; phone: string | null; role: Role;
  loyalty_points: number; referral_code: string | null; is_active: number; created_at: string;
};

export type Category = { id: number; slug: string; name: string; description: string | null; tone: Tone; image: string | null; sort: number };
export type Collection = { id: number; slug: string; name: string; blurb: string | null; description: string | null; tone: Tone; image: string | null; is_featured: number; is_active: number; sort: number };
export type Artisan = { id: number; slug: string; name: string; craft: string; place: string; bio: string | null; quote: string | null; tone: Tone; image: string | null };

export type ProductRow = {
  id: number; slug: string; name: string; description: string; kind: "physical" | "giftcard";
  craft: string | null; material: string | null; colors: string; dimensions: string | null; weight_g: number | null;
  care: string | null; specs: string; category_id: number | null; artisan_id: number | null; sku: string;
  price: number; compare_at: number | null; stock: number; low_stock_threshold: number;
  images: string; video_url: string | null; badge: string | null; tone: Tone; alt_tone: Tone;
  is_featured: number; is_active: number; rating_avg: number; rating_count: number; sold_count: number;
  seo_title: string | null; seo_description: string | null; created_at: string; updated_at: string;
};

/** Product as the UI consumes it (JSON columns parsed, category joined). */
export type Product = Omit<ProductRow, "colors" | "images" | "specs"> & {
  colors: string[]; images: string[]; specs: { label: string; value: string }[];
  category_name?: string | null; category_slug?: string | null;
  discount_pct: number; has_variants: boolean;
};

export type Variant = { id: number; product_id: number; label: string; sku: string | null; price: number | null; stock: number; sort: number };
export type Review = { id: number; product_id: number; user_id: number | null; name: string; rating: number; title: string | null; body: string; status: string; verified: number; created_at: string };
export type Address = { id: number; user_id: number; label: string | null; name: string; phone: string; line1: string; line2: string | null; city: string; state: string; pincode: string; country: string; is_default: number };
export type AddressInput = Omit<Address, "id" | "user_id" | "is_default" | "label" | "line2"> & { line2?: string | null; label?: string | null };

export const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled", "returned", "refunded"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending", confirmed: "Confirmed", processing: "Processing", shipped: "Shipped",
  out_for_delivery: "Out for Delivery", delivered: "Delivered", cancelled: "Cancelled", returned: "Returned", refunded: "Refunded",
};

export type OrderRow = {
  id: number; number: string; user_id: number | null; email: string; phone: string; status: OrderStatus;
  payment_status: "pending" | "paid" | "failed" | "refunded" | "partially_refunded"; payment_method: string | null; currency: string;
  subtotal: number; discount: number; shipping: number; tax: number; gift_wrap_fee: number; gift_card_used: number;
  points_used: number; points_earned: number; total: number; coupon_code: string | null; gift_card_code: string | null;
  shipping_address: string; billing_address: string; delivery_method: string; gift_wrap: number; gift_message: string | null;
  notes: string | null; razorpay_order_id: string | null; razorpay_payment_id: string | null; access_token: string;
  tracking_number: string | null; carrier: string | null; stock_released: number; idempotency_key: string | null; created_at: string; updated_at: string;
};
export type OrderItemRow = { id: number; order_id: number; product_id: number | null; variant_id: number | null; name: string; variant_label: string | null; sku: string | null; price: number; qty: number; image: string | null; tone: Tone | null; kind: string; meta: string | null };
export type OrderEvent = { id: number; order_id: number; status: string; note: string | null; created_at: string };

export type CartLine = { productId: number; variantId?: number | null; qty: number; meta?: { recipientEmail?: string; message?: string } };
