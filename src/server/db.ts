import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { seedIfEmpty } from "./seed";

/**
 * Data layer. SQLite via Node's built-in `node:sqlite` (no native deps, no account needed).
 * All SQL lives in src/server/*. To move to Postgres later, replace this module's
 * get/all/run/tx with a pg client and port the schema below — callers stay unchanged.
 */

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',          -- customer | staff | admin
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  referral_code TEXT UNIQUE,
  referred_by INTEGER REFERENCES users(id),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT
);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,                             -- sha256(token)
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  ip TEXT, ua TEXT
);
CREATE TABLE IF NOT EXISTS password_resets (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS addresses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT, name TEXT NOT NULL, phone TEXT NOT NULL,
  line1 TEXT NOT NULL, line2 TEXT, city TEXT NOT NULL, state TEXT NOT NULL,
  pincode TEXT NOT NULL, country TEXT NOT NULL DEFAULT 'India',
  is_default INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL, description TEXT,
  tone TEXT NOT NULL DEFAULT 'sand', image TEXT, sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL, blurb TEXT, description TEXT,
  tone TEXT NOT NULL DEFAULT 'sand', image TEXT,
  is_featured INTEGER NOT NULL DEFAULT 0, is_active INTEGER NOT NULL DEFAULT 1, sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS artisans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL, craft TEXT NOT NULL, place TEXT NOT NULL,
  bio TEXT, quote TEXT, tone TEXT NOT NULL DEFAULT 'sand', image TEXT
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL DEFAULT 'physical',           -- physical | giftcard
  craft TEXT, material TEXT, colors TEXT NOT NULL DEFAULT '[]',
  dimensions TEXT, weight_g INTEGER, care TEXT, specs TEXT NOT NULL DEFAULT '[]',
  category_id INTEGER REFERENCES categories(id),
  artisan_id INTEGER REFERENCES artisans(id),
  sku TEXT NOT NULL UNIQUE,
  price INTEGER NOT NULL,                          -- INR, whole rupees, tax-inclusive
  compare_at INTEGER,
  stock INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  images TEXT NOT NULL DEFAULT '[]',               -- JSON array of URLs
  video_url TEXT,
  badge TEXT,
  tone TEXT NOT NULL DEFAULT 'sand', alt_tone TEXT NOT NULL DEFAULT 'clay',
  is_featured INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  rating_avg REAL NOT NULL DEFAULT 0, rating_count INTEGER NOT NULL DEFAULT 0,
  sold_count INTEGER NOT NULL DEFAULT 0,
  seo_title TEXT, seo_description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE TABLE IF NOT EXISTS variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label TEXT NOT NULL,                              -- e.g. "Large / Antique Copper"
  sku TEXT UNIQUE,
  price INTEGER,                                    -- override; NULL = product price
  stock INTEGER NOT NULL DEFAULT 0,
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS product_collections (
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, collection_id)
);
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL, rating INTEGER NOT NULL, title TEXT, body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',           -- pending | approved | rejected
  verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS wishlist (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, product_id)
);
CREATE TABLE IF NOT EXISTS recently_viewed (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  viewed_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, product_id)
);
CREATE TABLE IF NOT EXISTS carts (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  reminder_sent_at TEXT
);
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  data TEXT NOT NULL, total INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  reminder_sent_at TEXT, recovered INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE COLLATE NOCASE,
  description TEXT,
  type TEXT NOT NULL,                               -- percent | fixed | freeship
  value INTEGER NOT NULL DEFAULT 0,
  min_order INTEGER NOT NULL DEFAULT 0,
  max_discount INTEGER,
  usage_limit INTEGER, used_count INTEGER NOT NULL DEFAULT 0,
  starts_at TEXT, expires_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT NOT NULL UNIQUE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  email TEXT NOT NULL, phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'pending',   -- pending | paid | failed | refunded | partially_refunded
  payment_method TEXT,
  currency TEXT NOT NULL DEFAULT 'INR',
  subtotal INTEGER NOT NULL, discount INTEGER NOT NULL DEFAULT 0,
  shipping INTEGER NOT NULL DEFAULT 0, tax INTEGER NOT NULL DEFAULT 0,
  gift_wrap_fee INTEGER NOT NULL DEFAULT 0, gift_card_used INTEGER NOT NULL DEFAULT 0,
  points_used INTEGER NOT NULL DEFAULT 0, points_earned INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  coupon_code TEXT, gift_card_code TEXT,
  shipping_address TEXT NOT NULL, billing_address TEXT NOT NULL,
  delivery_method TEXT NOT NULL DEFAULT 'standard',
  gift_wrap INTEGER NOT NULL DEFAULT 0, gift_message TEXT, notes TEXT,
  razorpay_order_id TEXT UNIQUE, razorpay_payment_id TEXT,
  idempotency_key TEXT UNIQUE,
  access_token TEXT NOT NULL,
  tracking_number TEXT, carrier TEXT,
  stock_released INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  variant_id INTEGER, name TEXT NOT NULL, variant_label TEXT, sku TEXT,
  price INTEGER NOT NULL, qty INTEGER NOT NULL,
  image TEXT, tone TEXT, kind TEXT NOT NULL DEFAULT 'physical',
  meta TEXT                                          -- JSON (gift card recipient etc.)
);
CREATE TABLE IF NOT EXISTS order_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL, note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, provider_order_id TEXT, provider_payment_id TEXT,
  amount INTEGER NOT NULL, status TEXT NOT NULL, method TEXT, raw TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_provider_payment ON payments(provider, provider_payment_id) WHERE provider_payment_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY, type TEXT NOT NULL, payload TEXT,
  processed_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS returns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id INTEGER REFERENCES order_items(id) ON DELETE SET NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL, details TEXT,
  status TEXT NOT NULL DEFAULT 'requested',         -- requested | approved | rejected | received | refunded
  refund_amount INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS banners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  placement TEXT NOT NULL DEFAULT 'promo',          -- announcement | hero | promo
  title TEXT NOT NULL, subtitle TEXT, image TEXT, href TEXT, cta TEXT,
  is_active INTEGER NOT NULL DEFAULT 1, sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE, source TEXT,
  subscribed INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS enquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,                               -- corporate | bulk | custom | contact
  name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, company TEXT,
  quantity INTEGER, budget TEXT, message TEXT, details TEXT,
  status TEXT NOT NULL DEFAULT 'new',               -- new | contacted | quoted | closed
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS gift_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE, amount INTEGER NOT NULL, balance INTEGER NOT NULL,
  purchaser_email TEXT, recipient_email TEXT, message TEXT,
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active',            -- active | used | void
  created_at TEXT NOT NULL DEFAULT (datetime('now')), expires_at TEXT
);
CREATE TABLE IF NOT EXISTS loyalty_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL, reason TEXT NOT NULL, order_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS email_outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  to_email TEXT NOT NULL, subject TEXT NOT NULL, body_html TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',            -- queued | sent | logged | failed
  error TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, meta TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

export type Param = SQLInputValue | undefined | boolean;
const norm = (p: Param[]): SQLInputValue[] => p.map((v) => (v === undefined ? null : typeof v === "boolean" ? (v ? 1 : 0) : v));

type G = typeof globalThis & { __khdb?: DatabaseSync };

function open(): DatabaseSync {
  const file = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "karigar.db");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const d = new DatabaseSync(file);
  d.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; PRAGMA synchronous = NORMAL;");
  d.exec(SCHEMA);
  seedIfEmpty(d);
  return d;
}

const g = globalThis as G;
export const db: DatabaseSync = (g.__khdb ??= open());

// node:sqlite returns null-prototype rows; React can't pass those to Client Components, so copy to plain objects.
export function all<T = Record<string, unknown>>(sql: string, ...p: Param[]): T[] {
  return db.prepare(sql).all(...norm(p)).map((r) => ({ ...r })) as T[];
}
export function get<T = Record<string, unknown>>(sql: string, ...p: Param[]): T | undefined {
  const r = db.prepare(sql).get(...norm(p));
  return r ? ({ ...r } as T) : undefined;
}
export function run(sql: string, ...p: Param[]): { changes: number; id: number } {
  const r = db.prepare(sql).run(...norm(p));
  return { changes: Number(r.changes), id: Number(r.lastInsertRowid) };
}
/** Run fn inside a transaction (rolls back on throw). Nested calls join the outer transaction. */
let depth = 0;
export function tx<T>(fn: () => T): T {
  if (depth > 0) return fn();
  db.exec("BEGIN IMMEDIATE");
  depth++;
  try {
    const r = fn();
    db.exec("COMMIT");
    return r;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  } finally {
    depth--;
  }
}

export const json = <T>(s: string | null | undefined, fallback: T): T => {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
};
