"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { cartKey, convert, SYMBOL } from "@/lib/format";
import type { CartLine } from "@/server/types";

export type PublicUser = { id: number; name: string; email: string; role: "customer" | "staff" | "admin" } | null;
type Ctx = {
  user: PublicUser; ready: boolean;
  cart: CartLine[]; cartCount: number; addToCart: (l: CartLine, o?: { silent?: boolean }) => void; setQty: (key: string, qty: number) => void; removeLine: (key: string) => void; clearCart: () => void;
  drawerOpen: boolean; openDrawer: () => void; closeDrawer: () => void;
  wishlist: number[]; inWishlist: (id: number) => boolean; toggleWishlist: (id: number) => void;
  recent: number[]; pushRecent: (id: number) => void;
  currency: string; setCurrency: (c: string) => void; price: (inr: number) => string;
  toast: (msg: string) => void;
};
const StoreCtx = createContext<Ctx | null>(null);
export const useStore = () => { const c = useContext(StoreCtx); if (!c) throw new Error("StoreProvider missing"); return c; };

const read = <T,>(k: string, fb: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fb; } catch { return fb; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const post = (url: string, body: unknown, method = "POST") => fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()).catch(() => null);

export function StoreProvider({ user, rates, children }: { user: PublicUser; rates: Record<string, number>; children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [recent, setRecent] = useState<number[]>([]);
  const [currency, setCurrencyState] = useState("INR");
  const [drawerOpen, setDrawer] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const syncTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const toast = useCallback((m: string) => { setMsg(m); clearTimeout(timer.current); timer.current = setTimeout(() => setMsg(null), 2600); }, []);

  // hydrate from localStorage, then merge with the server for signed-in users
  useEffect(() => {
    const localCart = read<CartLine[]>("kh_cart", []);
    const localWish = read<number[]>("kh_wish", []);
    setRecent(read<number[]>("kh_recent", []));
    setCurrencyState(read<string>("kh_currency", "INR"));
    (async () => {
      let c = localCart, w = localWish;
      if (user) {
        const [sc, sw] = await Promise.all([fetch("/api/cart").then((r) => r.json()).catch(() => ({ lines: [] })), fetch("/api/wishlist").then((r) => r.json()).catch(() => ({ ids: [] }))]);
        const m = new Map<string, CartLine>();
        for (const l of [...(sc.lines as CartLine[]), ...localCart]) { const k = cartKey(l); const e = m.get(k); m.set(k, e ? { ...e, qty: Math.max(e.qty, l.qty) } : l); }
        c = [...m.values()];
        const serverIds = sw.ids as number[];
        for (const id of localWish) if (!serverIds.includes(id)) await post("/api/wishlist", { productId: id, ensure: true });
        w = [...new Set([...serverIds, ...localWish])];
        write("kh_wish", []);
      }
      setCart(c); setWishlist(w); setReady(true);
    })();
  }, [user]);

  // persist cart
  useEffect(() => {
    if (!ready) return;
    write("kh_cart", cart);
    if (user) { clearTimeout(syncTimer.current); syncTimer.current = setTimeout(() => post("/api/cart", { lines: cart }, "PUT"), 600); }
  }, [cart, ready, user]);
  useEffect(() => { if (ready && !user) write("kh_wish", wishlist); }, [wishlist, ready, user]);

  const openDrawer = useCallback(() => setDrawer(true), []);
  const closeDrawer = useCallback(() => setDrawer(false), []);

  const addToCart: Ctx["addToCart"] = useCallback((l, o) => {
    setCart((cur) => {
      const k = cartKey(l); const i = cur.findIndex((x) => cartKey(x) === k);
      if (i >= 0) return cur.map((x, j) => (j === i ? { ...x, qty: Math.min(x.qty + l.qty, 50) } : x));
      return [...cur, l];
    });
    if (!o?.silent) setDrawer(true);
  }, []);
  const setQty = useCallback((key: string, qty: number) => setCart((cur) => qty <= 0 ? cur.filter((x) => cartKey(x) !== key) : cur.map((x) => (cartKey(x) === key ? { ...x, qty: Math.min(qty, 50) } : x))), []);
  const removeLine = useCallback((key: string) => setCart((cur) => cur.filter((x) => cartKey(x) !== key)), []);
  const clearCart = useCallback(() => setCart([]), []);

  const toggleWishlist = useCallback((id: number) => {
    setWishlist((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [id, ...cur]));
    const adding = !wishlist.includes(id);
    toast(adding ? "Saved to wishlist" : "Removed from wishlist");
    if (user) post("/api/wishlist", { productId: id });
  }, [user, wishlist, toast]);

  const pushRecent = useCallback((id: number) => {
    setRecent((cur) => { const n = [id, ...cur.filter((x) => x !== id)].slice(0, 12); write("kh_recent", n); return n; });
    if (user) post("/api/recent", { productId: id });
  }, [user]);

  const setCurrency = useCallback((c: string) => { setCurrencyState(c); write("kh_currency", c); }, []);
  const price = useCallback((inr: number) => {
    const v = convert(inr, currency, rates);
    return (currency === "INR" ? "" : "≈ ") + (SYMBOL[currency] ?? "") + v.toLocaleString(currency === "INR" ? "en-IN" : "en-US", { maximumFractionDigits: currency === "INR" ? 0 : 2 });
  }, [currency, rates]);

  const value = useMemo<Ctx>(() => ({
    user, ready, cart, cartCount: cart.reduce((s, l) => s + l.qty, 0), addToCart, setQty, removeLine, clearCart,
    drawerOpen, openDrawer, closeDrawer, wishlist, inWishlist: (id) => wishlist.includes(id), toggleWishlist, recent, pushRecent, currency, setCurrency, price, toast,
  }), [user, ready, cart, addToCart, setQty, removeLine, clearCart, drawerOpen, openDrawer, closeDrawer, wishlist, toggleWishlist, recent, pushRecent, currency, setCurrency, price, toast]);

  return (
    <StoreCtx.Provider value={value}>
      {children}
      <CartDrawer />
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-[90] flex justify-center px-4">
        {msg && <div className="pointer-events-auto bg-charcoal px-5 py-3 text-sm text-ivory shadow-[var(--shadow-lift)]">{msg}</div>}
      </div>
    </StoreCtx.Provider>
  );
}
