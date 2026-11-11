import { createHmac } from "node:crypto";
import { safeEqual } from "./security";

/**
 * Razorpay over REST (no SDK). Keys come from env:
 *   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET
 * Without keys, a clearly-labelled MOCK gateway is available in development
 * (or in production only when MOCK_PAYMENTS=1) so the whole flow can be tested.
 */
const API = "https://api.razorpay.com/v1";
export const razorpayKeyId = () => process.env.RAZORPAY_KEY_ID ?? "";
export const razorpayConfigured = () => !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
export const mockEnabled = () => !razorpayConfigured() && (process.env.NODE_ENV !== "production" || process.env.MOCK_PAYMENTS === "1");
export const paymentsAvailable = () => razorpayConfigured() || mockEnabled();

const auth = () => "Basic " + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");

async function rz<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API + path, { ...init, headers: { Authorization: auth(), "Content-Type": "application/json", ...(init?.headers ?? {}) }, cache: "no-store" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Razorpay ${res.status}: ${body?.error?.description ?? "request failed"}`);
  return body as T;
}

/** amountRupees → paise for Razorpay. */
export async function createGatewayOrder(amountRupees: number, receipt: string, currency = "INR"): Promise<{ id: string; mock: boolean }> {
  if (!razorpayConfigured()) return { id: `mock_${receipt}_${Date.now().toString(36)}`, mock: true };
  const o = await rz<{ id: string }>("/orders", { method: "POST", body: JSON.stringify({ amount: Math.round(amountRupees * 100), currency, receipt }) });
  return { id: o.id, mock: false };
}

export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  return safeEqual(createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex"), signature);
}
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  return safeEqual(createHmac("sha256", secret).update(rawBody).digest("hex"), signature);
}

export type GatewayPayment = { id: string; order_id: string; amount: number; status: string; method?: string; currency: string };
/** Re-fetch the payment from Razorpay so we never trust client-supplied amounts/status. */
export async function fetchPayment(paymentId: string): Promise<GatewayPayment> {
  return rz<GatewayPayment>(`/payments/${encodeURIComponent(paymentId)}`);
}
export async function capturePayment(paymentId: string, amountRupees: number, currency = "INR") {
  return rz<GatewayPayment>(`/payments/${encodeURIComponent(paymentId)}/capture`, { method: "POST", body: JSON.stringify({ amount: Math.round(amountRupees * 100), currency }) });
}
export async function refundPayment(paymentId: string, amountRupees: number): Promise<{ id: string } | null> {
  if (!razorpayConfigured() || paymentId.startsWith("mockpay_")) return null;
  return rz<{ id: string }>(`/payments/${encodeURIComponent(paymentId)}/refund`, { method: "POST", body: JSON.stringify({ amount: Math.round(amountRupees * 100) }) });
}
