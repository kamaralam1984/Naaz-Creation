import type { DatabaseSync } from "node:sqlite";
import { randomBytes, scryptSync } from "node:crypto";
import { REAL_CATEGORIES, REAL_COLLECTIONS, REAL_PRODUCTS } from "./catalog-data";

/**
 * Demo catalog so the storefront is usable from the first run.
 * Everything here is SAMPLE content — edit or delete it from /admin before launch.
 * Seeds only when the products table is empty. Re-run from scratch: delete data/karigar.db.
 */

const ARTISANS: [string, string, string, string, string, string, string][] = [
  ["meera-devi", "Meera Devi", "Madhubani painter", "Madhubani, Bihar", "Meera learnt to paint on the mud walls of her family home at the age of eight. Today she leads a cooperative of 14 women painters.", "Every line is drawn the way my grandmother taught me.", "wine"],
  ["sunita-kumhar", "Sunita Kumhar", "Terracotta potter", "Molela, Rajasthan", "Sunita works the village's red clay by hand, firing each piece in an open kiln fuelled by dried cow dung and wood.", "Clay remembers the hand that held it.", "clay"],
  ["lakshmi-bai", "Lakshmi Bai", "Jute weaver", "Nadia, West Bengal", "Lakshmi and her self-help group weave jute into bags that are sturdy, light and entirely plastic-free.", "We weave a little of the river into every bag.", "sand"],
  ["farida-begum", "Farida Begum", "Mirror & mosaic artist", "Moradabad, Uttar Pradesh", "Farida sets hundreds of tiny mirror pieces into hand-painted wood, one ring at a time, working with a team of eight women from her neighbourhood.", "Every little mirror is a little piece of sky.", "wine"],
  ["ramesh-prajapati", "Ramesh Prajapati", "Soft-furnishing maker & weaver", "Panipat, Haryana", "Ramesh's workshop smocks satin cushions by hand and weaves wool wall hangings on traditional looms.", "A good cushion is folded by hand a thousand times.", "wine"],
  ["anita-sharma", "Anita Sharma", "Zardozi & straw artist", "Lucknow, Uttar Pradesh", "Anita trained as a zardozi embroiderer and now also cuts golden straw into trees, birds and suns for framed wall art.", "Gold thread asks for patience; straw asks for a steady breath.", "brass"],
];

const REVIEW_NAMES = ["Ananya R.", "Vikram S.", "Priya K.", "Rohan M.", "Kavya N.", "Arjun P.", "Neha T.", "Sameer D.", "Isha B.", "Karan J."];
const REVIEW_BODIES = [
  "Beautifully made — you can see and feel the hand of the maker. Packed with great care.",
  "Better than the photos. It has become the first thing guests ask about.",
  "Solid, well finished and exactly as described. Delivery was quick.",
  "Bought as a gift and the recipient loved it. The story card was a lovely touch.",
  "Gorgeous craftsmanship at a fair price. Will definitely order again.",
];
const CARE: Record<string, string> = {
  Ceramic: "Wipe with a damp cloth. Hand-wash gently; avoid sudden temperature changes. Use a drip tray under planters to protect surfaces.",
  Satin: "Spot-clean with a damp cloth and mild soap. Dry-clean the cover for deep cleaning; do not wring or machine-wash. Iron on a low setting through a cloth.",
  Velvet: "Brush gently along the pile and spot-clean with a barely damp cloth. Do not soak; dry-clean for deep cleaning. Keep out of long direct sunlight.",
  "Wool & Cotton": "Dust with a soft brush or vacuum on low. Spot-clean only; do not wash. Hang away from damp and direct sunlight.",
  "Wood & Mirror": "Wipe the mirror pieces with a dry or slightly damp soft cloth. Do not soak. Keep away from moisture and direct heat.",
  "Gold Thread & Velvet": "Dust gently with a soft dry brush. Keep out of damp and direct sunlight; do not touch the zardozi thread with wet hands.",
  "Straw, Wood & Glass": "Wipe the glass with a dry microfibre cloth; never spray cleaner onto the frame. Keep away from damp and direct sunlight.",
  "Shell, Wood & Glass": "Wipe the glass with a dry microfibre cloth; never spray cleaner onto the frame. Keep away from damp and direct sunlight.",
  "Burlap & Jute": "Dust with a soft brush or a cool hair-dryer. Do not wet. Keep away from damp and direct sunlight to preserve colour.",
  Copper: "Wipe with a soft cloth. Clean with lemon and salt to restore shine. Avoid dishwashers and acidic liquids for long storage.",
  Brass: "Dust with a soft cloth. Polish occasionally with a lemon-and-salt paste; keep dry to maintain the antique patina.",
  Terracotta: "Hand-wash gently with water; do not use soap on unglazed surfaces. Air-dry fully and keep away from sudden temperature changes.",
  "Mango Wood": "Wipe with a damp cloth and dry immediately. Re-oil with coconut or linseed oil every few months. Keep away from direct heat.",
  Sheesham: "Wipe with a damp cloth and dry immediately. Re-oil occasionally. Avoid soaking and direct sunlight.",
  "Acacia Wood": "Wipe with a damp cloth and dry immediately. Re-oil occasionally; keep away from direct heat.",
  Wood: "Wipe with a dry or slightly damp cloth. Avoid soaking; painted surfaces are sealed but not dishwasher-safe.",
  Jute: "Spot-clean with a damp cloth and air-dry. Do not machine wash. Store in a dry place.",
  "Handmade Paper": "Keep away from direct sunlight and moisture. Frame behind UV-protective glass for best longevity.",
  "Cotton Canvas": "Keep out of direct sunlight; dust with a soft dry brush.",
  "Cotton Cloth": "Keep out of direct sunlight; dust with a soft dry brush.",
};

export function seedIfEmpty(d: DatabaseSync) {
  if ((d.prepare("SELECT COUNT(*) AS n FROM products").get() as { n: number }).n > 0) return;
  d.exec("BEGIN");
  try {
    const run = (sql: string, ...p: (string | number | null)[]) => d.prepare(sql).run(...p);
    const id = (sql: string, ...p: (string | number | null)[]) => (d.prepare(sql).get(...p) as { id: number }).id;

    REAL_CATEGORIES.forEach(([slug, name, tone, desc, image], i) => run("INSERT INTO categories(slug,name,tone,description,image,sort) VALUES(?,?,?,?,?,?)", slug, name, tone, desc, image, i));
    ARTISANS.forEach(([slug, name, craft, place, bio, quote, tone]) => run("INSERT INTO artisans(slug,name,craft,place,bio,quote,tone) VALUES(?,?,?,?,?,?,?)", slug, name, craft, place, bio, quote, tone));
    REAL_COLLECTIONS.forEach(([slug, name, blurb, desc, tone, feat, image], i) => run("INSERT INTO collections(slug,name,blurb,description,tone,image,is_featured,sort) VALUES(?,?,?,?,?,?,?,?)", slug, name, blurb, desc, tone, image, feat, i));

    REAL_PRODUCTS.forEach((p, n) => {
      const specs = [
        { label: "Material", value: p.material }, { label: "Craft", value: p.craft }, { label: "Dimensions", value: p.dims },
        { label: "Weight", value: `${p.weight} g` }, { label: "Origin", value: ARTISANS.find((a) => a[0] === p.artisan)![3] },
        { label: "Finish", value: "Natural, hand-finished" },
      ];
      const desc = `${p.blurb}\n\nEvery piece is made by hand, so slight variations in colour, texture and form are part of its character — and proof that no two are alike.`;
      const pid = Number(run(
        `INSERT INTO products(slug,name,description,craft,material,colors,dimensions,weight_g,care,specs,category_id,artisan_id,sku,price,compare_at,stock,images,badge,tone,alt_tone,is_featured,sold_count,created_at,seo_title,seo_description)
         VALUES(?,?,?,?,?,?,?,?,?,?,(SELECT id FROM categories WHERE slug=?),(SELECT id FROM artisans WHERE slug=?),?,?,?,?,?,?,?,?,?,?,datetime('now', ?),?,?)`,
        p.slug, p.name, desc, p.craft, p.material, JSON.stringify(p.colors), p.dims, p.weight, p.care ?? CARE[p.material] ?? "Handle with care and keep dry.", JSON.stringify(specs),
        p.cat, p.artisan, `KH-${String(1000 + n)}`, p.price, p.compare ?? null, p.variants ? p.variants.reduce((s, v) => s + v[2], 0) : p.stock, JSON.stringify(p.images),
        p.badge ?? null, p.tone, p.alt, p.featured ? 1 : 0, p.sold, `-${p.days} days`,
        `${p.name} — Handcrafted ${p.craft} | Naaz Creation`, `${p.blurb.slice(0, 150)}`).lastInsertRowid);
      p.variants?.forEach(([label, price, stock], i) => run("INSERT INTO variants(product_id,label,sku,price,stock,sort) VALUES(?,?,?,?,?,?)", pid, label, `KH-${1000 + n}-${i + 1}`, price, stock, i));
      p.cols.forEach((c) => run("INSERT INTO product_collections(product_id, collection_id) VALUES(?, ?)", pid, id("SELECT id FROM collections WHERE slug=?", c)));
      if (p.sold > 0) {
        const count = 2 + (n % 3);
        for (let i = 0; i < count; i++) {
          run("INSERT INTO reviews(product_id,name,rating,title,body,status,verified,created_at) VALUES(?,?,?,?,?,'approved',1,datetime('now', ?))",
            pid, REVIEW_NAMES[(n + i * 3) % REVIEW_NAMES.length], (n + i) % 4 === 0 ? 4 : 5, i === 0 ? "Worth every rupee" : null, REVIEW_BODIES[(n + i) % REVIEW_BODIES.length], `-${5 + i * 11 + (n % 7)} days`);
        }
        const r = d.prepare("SELECT AVG(rating) a, COUNT(*) n FROM reviews WHERE product_id=?").get(pid) as { a: number; n: number };
        run("UPDATE products SET rating_avg=?, rating_count=? WHERE id=?", Math.round(r.a * 10) / 10, r.n, pid);
      }
    });

    // Gift card product (denominations are variants)
    const gc = Number(run("INSERT INTO products(slug,name,description,kind,sku,price,stock,images,tone,alt_tone,craft,material,category_id) VALUES('gift-card','Naaz Creation Gift Card','Give the gift of choice. Delivered instantly by email, valid for 12 months, redeemable on anything in the house.','giftcard','KH-GIFT',1000,9999,'[]','brass','wine','Gift Card','Digital',NULL)").lastInsertRowid);
    [500, 1000, 2500, 5000].forEach((v, i) => run("INSERT INTO variants(product_id,label,sku,price,stock,sort) VALUES(?,?,?,?,?,?)", gc, `₹${v.toLocaleString("en-IN")}`, `KH-GIFT-${v}`, v, 9999, i));

    run("INSERT INTO coupons(code,description,type,value,min_order,max_discount) VALUES('WELCOME10','10% off your first order over ₹2,000','percent',10,2000,500)");
    run("INSERT INTO coupons(code,description,type,value,min_order) VALUES('SHIPFREE','Free shipping on orders over ₹1,500','freeship',0,1500)");
    run("INSERT INTO coupons(code,description,type,value,min_order,max_discount) VALUES('FESTIVE15','15% off orders over ₹5,000','percent',15,5000,1500)");
    run("INSERT INTO coupons(code,description,type,value,min_order) VALUES('FLAT200','₹200 off orders over ₹1,800','fixed',200,1800)");

    run("INSERT INTO banners(placement,title,subtitle,href,cta,sort) VALUES('promo','The Festive Edit','Diyas, trays and tables made for gathering.','/collections/festive-table','Shop the edit',0)");
    run("INSERT INTO settings(key,value) VALUES('announcement','Free shipping across India above ₹3,000')");

    // Admin account (change the password immediately in production!)
    const email = (process.env.ADMIN_EMAIL ?? "admin@naazcreation.com").toLowerCase();
    let pw = process.env.ADMIN_PASSWORD;
    if (!pw) {
      if (process.env.NODE_ENV === "production") { pw = randomBytes(9).toString("base64url"); console.warn(`\n[karigar-house] ADMIN_PASSWORD not set. Generated one-time admin password for ${email}: ${pw}\n`); }
      else pw = "Admin@12345";
    }
    const salt = randomBytes(16);
    const hash = `scrypt$${salt.toString("hex")}$${scryptSync(pw, salt, 64).toString("hex")}`;
    run("INSERT INTO users(email,name,password_hash,role,referral_code) VALUES(?,?,?,'admin','HOUSE')", email, "Store Admin", hash);
    d.exec("COMMIT");
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}
