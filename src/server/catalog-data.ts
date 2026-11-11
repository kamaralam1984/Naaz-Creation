/**
 * REAL-PHOTO CATALOG — products cut out from the shop's own photographs (public/catalog/*.webp).
 *
 * ⚠ SAMPLE VALUES TO CONFIRM IN /admin BEFORE LAUNCH:
 *   • Prices, compare-at (sale) prices, stock counts and sold counts are PLACEHOLDERS — the photos carry no price data.
 *   • Dimensions and weights are visual ESTIMATES, not measurements.
 *   • Names, descriptions, material and craft attributions are written from what is visible in each photo;
 *     please correct anything that is not accurate (e.g. exact clay/glaze, origin of each piece).
 *   • Artisan attributions are sample content (see ARTISANS in seed.ts) — replace with the real makers.
 *   • Photos are transparent-background cut-outs (one per product); add more angles via /admin/products.
 */

export type RealProduct = {
  slug: string; name: string; cat: string; craft: string; material: string; colors: string[]; price: number; compare?: number; stock: number;
  tone: string; alt: string; blurb: string; dims: string; weight: number; artisan: string; badge?: string; featured?: boolean; sold: number; days: number;
  cols: string[]; variants?: [string, number | null, number][]; images: string[]; care?: string;
};

const img = (s: string) => [`/catalog/${s}.webp`];

// [slug, name, tone, description, image]
export const REAL_CATEGORIES: [string, string, string, string, string][] = [
  ["framed-art", "Framed Art & Paintings", "brass", "Golden straw art, Madhubani paintings, shell work and zardozi — framed and ready to hang.", "/catalog/golden-tree-of-life-frame.webp"],
  ["wall-hangings", "Wall Hangings & Mirror Plates", "ink", "Handwoven wall hangings and mirror-mosaic plates that turn a bare wall into a story.", "/catalog/buddha-mosaic-wall-plate.webp"],
  ["cushions", "Cushions & Soft Furnishings", "wine", "Hand-smocked satin and velvet cushions and bolsters that bring colour and texture to a sofa or bed.", "/catalog/teal-flower-cushion.webp"],
  ["flowers", "Handmade Flowers", "sand", "Everlasting roses made from burlap and jute, arranged in baskets and woven pots.", "/catalog/paper-rose-basket-bouquet.webp"],
  ["bags", "Bags & Accessories", "sand", "Hand-embroidered jute bags painted with Madhubani-inspired motifs.", "/catalog/madhubani-jute-sling-bag.webp"],
  ["pottery", "Pottery & Terracotta", "clay", "Carved and hand-finished terracotta for the home.", "/catalog/elephant-ear-terracotta-vase.webp"],
];

// [slug, name, blurb, description, tone, featured, image]
export const REAL_COLLECTIONS: [string, string, string, string, string, number, string][] = [
  ["golden-straw", "Golden Straw & Zardozi", "Gold cut by hand, framed for the wall.", "Straw-art trees, fish and Buddhas, shell work and zardozi — gold on black and crimson.", "brass", 1, "/catalog/golden-straw-buddha-frame.webp"],
  ["mirror-mosaic", "Mirror & Mosaic", "Hundreds of tiny mirrors, set one by one.", "Mirror-inlaid plates and ring mirrors that scatter light across a room.", "ink", 1, "/catalog/red-mirror-mosaic-plate.webp"],
  ["soft-furnishings", "Soft Furnishings", "Satin, velvet and hand-smocking.", "Cushions and bolsters smocked by hand — jewel colours for sofas, beds and window seats.", "wine", 1, "/catalog/crimson-pintuck-bolster.webp"],
  ["wall-stories", "Wall Stories", "Paintings and weaves with a point of view.", "Framed art, woven hangings and mosaic plates that anchor a room.", "ink", 0, "/catalog/madhubani-framed-panel.webp"],
  ["gifting-edit", "The Gifting Edit", "Thoughtful, giftable, ready to wrap.", "Pieces we love to give — each arrives with its maker's story.", "sand", 0, "/catalog/paper-rose-basket-bouquet.webp"],
];

export const REAL_PRODUCTS: RealProduct[] = [
  /* ───────────── Framed Art & Paintings ───────────── */
  { slug: "golden-straw-buddha-frame", name: "Golden Straw Buddha under the Bodhi Tree, Framed", cat: "framed-art", craft: "Straw Art", material: "Straw, Wood & Glass", colors: ["Gold", "Black"], price: 4290, stock: 6, tone: "ink", alt: "brass", artisan: "anita-sharma", badge: "New", featured: true, sold: 12, days: 4, cols: ["golden-straw", "wall-stories", "gifting-edit"], dims: "30 × 55 cm framed", weight: 1300, images: img("golden-straw-buddha-frame"),
    blurb: "A seated Buddha beneath a bodhi canopy, every line cut from golden straw and laid on a midnight-black ground above a lotus pond. Set in a slim black frame under glass." },
  { slug: "golden-straw-fish-frame", name: "Golden Straw Fish Frame", cat: "framed-art", craft: "Straw Art", material: "Straw, Wood & Glass", colors: ["Gold", "Black", "Walnut"], price: 2990, stock: 9, tone: "ink", alt: "brass", artisan: "anita-sharma", badge: "New", sold: 18, days: 7, cols: ["golden-straw", "wall-stories", "gifting-edit"], dims: "35 × 35 cm framed", weight: 1000, images: img("golden-straw-fish-frame"),
    blurb: "A patterned fish — a symbol of good fortune — worked in golden straw on black velvet, with a gilt inner line and an ivory mount in a walnut-finish frame." },
  { slug: "golden-tree-of-life-frame", name: "Golden Straw Tree of Life, Framed", cat: "framed-art", craft: "Straw Art", material: "Straw, Wood & Glass", colors: ["Gold", "Black"], price: 3790, stock: 8, tone: "ink", alt: "brass", artisan: "anita-sharma", badge: "Best Seller", featured: true, sold: 47, days: 38, cols: ["golden-straw", "wall-stories", "gifting-edit"], dims: "45 × 55 cm framed", weight: 1700, images: img("golden-tree-of-life-frame"),
    blurb: "A tree of life with roots and branches cut from golden straw, with doves and a rising sun on a midnight-black ground. Framed in dark wood under glass." },
  { slug: "madhubani-framed-panel", name: "Madhubani Saraswati & Peacock Panel", cat: "framed-art", craft: "Madhubani Painting", material: "Handmade Paper", colors: ["Blue", "Green", "Pink"], price: 5400, stock: 4, tone: "wine", alt: "sand", artisan: "meera-devi", badge: "New", sold: 8, days: 5, cols: ["wall-stories"], dims: "30 × 80 cm", weight: 600, images: img("madhubani-framed-panel"),
    blurb: "A tall Madhubani panel painted in natural-pigment colours: peacocks among trees above a seated goddess playing the veena on a lotus, bordered in blue." },
  { slug: "madhubani-wedding-painting", name: "Madhubani Wedding Procession Painting", cat: "framed-art", craft: "Madhubani Painting", material: "Handmade Paper", colors: ["Red", "Yellow", "Green", "Blue"], price: 4890, stock: 3, tone: "wine", alt: "brass", artisan: "meera-devi", sold: 7, days: 80, cols: ["wall-stories", "gifting-edit"], dims: "50 × 75 cm (unframed)", weight: 400, images: img("madhubani-wedding-painting"),
    blurb: "A densely patterned Madhubani painting of a wedding procession, ringed by a border of fish and lotus motifs in vivid reds, yellows and greens. Sold unframed — ready for the frame of your choice." },
  { slug: "shell-sun-framed-art", name: "Shell Sunburst Framed Art", cat: "framed-art", craft: "Shell & Straw Inlay", material: "Shell, Wood & Glass", colors: ["Black", "Gold", "Ivory"], price: 2890, stock: 7, tone: "ink", alt: "brass", artisan: "anita-sharma", sold: 19, days: 61, cols: ["golden-straw", "wall-stories", "gifting-edit"], dims: "35 × 35 cm framed", weight: 1100, images: img("shell-sun-framed-art"),
    blurb: "A sunburst of tiny shells and golden filaments set on black card, in an ivory mount and a carved antique-silver frame. A small, graphic piece for a hallway or desk wall." },
  { slug: "zardozi-charkha-frame", name: "Zardozi Charkha on Crimson, Framed", cat: "framed-art", craft: "Zardozi Embroidery", material: "Gold Thread & Velvet", colors: ["Crimson", "Gold"], price: 4290, stock: 5, tone: "wine", alt: "brass", artisan: "anita-sharma", featured: true, sold: 14, days: 44, cols: ["golden-straw", "wall-stories", "gifting-edit"], dims: "55 × 35 cm framed", weight: 1300, images: img("zardozi-charkha-frame"),
    blurb: "A spinning wheel worked in metallic gold zardozi thread on deep-red velvet, bordered with a gilt line and set in an ivory mount. A thoughtful gift with a story of Indian craft." },

  /* ───────────── Wall Hangings & Mirror Plates ───────────── */
  { slug: "buddha-mosaic-wall-plate", name: "Buddha Mirror-Mosaic Wall Plate", cat: "wall-hangings", craft: "Mirror & Mosaic Work", material: "Wood & Mirror", colors: ["Crimson", "Blue", "Gold"], price: 3490, compare: 3990, stock: 8, tone: "wine", alt: "brass", artisan: "farida-begum", featured: true, sold: 29, days: 23, cols: ["mirror-mosaic", "wall-stories", "gifting-edit"], dims: "Ø 50 cm", weight: 1100, images: img("buddha-mosaic-wall-plate"),
    blurb: "A hand-painted seated Buddha at the centre of concentric rings of blue, ochre and crimson, each ring inlaid with tiny mirror triangles that sparkle as you pass." },
  { slug: "red-mirror-mosaic-plate", name: "Crimson Mirror-Mosaic Wall Plate", cat: "wall-hangings", craft: "Mirror & Mosaic Work", material: "Wood & Mirror", colors: ["Red", "Silver"], price: 2990, stock: 10, tone: "wine", alt: "ink", artisan: "farida-begum", badge: "New", sold: 21, days: 10, cols: ["mirror-mosaic", "wall-stories"], dims: "Ø 45 cm", weight: 900, images: img("red-mirror-mosaic-plate"),
    blurb: "A round plate in lacquer-red inlaid with hundreds of mirror diamonds, crescents and drops radiating from a central sun. Lit by a window or a lamp, it throws a thousand reflections." },
  { slug: "blue-mirror-mosaic-plate", name: "Cobalt Mirror-Mosaic Wall Plate", cat: "wall-hangings", craft: "Mirror & Mosaic Work", material: "Wood & Mirror", colors: ["Cobalt", "Silver"], price: 2990, compare: 3490, stock: 9, tone: "ink", alt: "wine", artisan: "farida-begum", badge: "Sale", sold: 26, days: 33, cols: ["mirror-mosaic", "wall-stories"], dims: "Ø 45 cm", weight: 900, images: img("blue-mirror-mosaic-plate"),
    blurb: "A cobalt-rimmed plate with rings of mirror stars and diamonds closing in on a mirrored sun at the centre. Hangs from a fixed loop at the back." },
  { slug: "turquoise-ring-mirror", name: "Turquoise Petal Ring Mirror", cat: "wall-hangings", craft: "Mirror & Mosaic Work", material: "Wood & Mirror", colors: ["Turquoise", "Ivory", "Silver"], price: 3290, stock: 7, tone: "ink", alt: "brass", artisan: "farida-begum", featured: true, sold: 17, days: 16, cols: ["mirror-mosaic", "wall-stories", "gifting-edit"], dims: "Ø 40 cm", weight: 800, images: img("turquoise-ring-mirror"),
    blurb: "A round wall mirror framed in turquoise petals studded with tiny mirror pieces and edged with a twisted white rope. A bright accent for an entryway or a bedroom wall." },
  { slug: "woven-cottage-wall-hanging", name: "Handwoven Cottage Wall Hanging", cat: "wall-hangings", craft: "Handloom Weaving", material: "Wool & Cotton", colors: ["Marigold", "Red", "Green"], price: 2290, stock: 10, tone: "brass", alt: "wine", artisan: "ramesh-prajapati", sold: 15, days: 70, cols: ["wall-stories"], dims: "35 × 70 cm (excl. fringe)", weight: 650, images: img("woven-cottage-wall-hanging"),
    blurb: "A handwoven wall hanging in saturated wool: a half-timbered cottage under a marigold sky, finished with a colourful tassel fringe and a braided hanging cord." },
  { slug: "woven-village-wall-hanging", name: "Handwoven Village Scene Wall Hanging", cat: "wall-hangings", craft: "Handloom Weaving", material: "Wool & Cotton", colors: ["Peach", "Green", "Brown"], price: 2590, stock: 8, tone: "clay", alt: "sand", artisan: "ramesh-prajapati", sold: 11, days: 92, cols: ["wall-stories"], dims: "50 × 80 cm (excl. fringe)", weight: 850, images: img("woven-village-wall-hanging"),
    blurb: "A broad woven hanging with a streaky peach sky above a village of tiled-roof houses and a bullock cart, worked in layered wool yarns and finished with a long fringe." },
  { slug: "woven-tree-wall-hanging", name: "Handwoven Banyan Tree Wall Hanging", cat: "wall-hangings", craft: "Handloom Weaving", material: "Wool & Cotton", colors: ["Cream", "Chocolate", "Ochre"], price: 2790, stock: 8, tone: "sand", alt: "clay", artisan: "ramesh-prajapati", badge: "New", sold: 9, days: 8, cols: ["wall-stories", "gifting-edit"], dims: "55 × 60 cm (excl. fringe)", weight: 800, images: img("woven-tree-wall-hanging"),
    blurb: "A sweeping banyan tree in chocolate-brown yarn, its leaves worked in herringbone stitch on a cream ground and finished with a rainbow fringe and a plain hanging cord." },

  /* ───────────── Cushions & Soft Furnishings ───────────── */
  { slug: "pink-satin-round-cushion", name: "Blush Satin Button Cushion", cat: "cushions", craft: "Hand Smocking", material: "Satin", colors: ["Blush Pink"], price: 1290, compare: 1590, stock: 26, tone: "wine", alt: "sand", artisan: "ramesh-prajapati", badge: "Best Seller", sold: 83, days: 28, cols: ["soft-furnishings", "gifting-edit"], dims: "Ø 40 cm", weight: 450, images: img("pink-satin-round-cushion"),
    variants: [["14 inch", null, 14], ["16 inch", 1690, 12]],
    blurb: "A round satin cushion gathered into soft pleats that radiate from a covered button at the centre. The blush-pink sheen catches the light like silk." },
  { slug: "crimson-pintuck-bolster", name: "Crimson Pintuck Bolster", cat: "cushions", craft: "Hand Smocking", material: "Satin", colors: ["Crimson", "Ivory"], price: 1490, stock: 20, tone: "wine", alt: "clay", artisan: "ramesh-prajapati", sold: 45, days: 50, cols: ["soft-furnishings"], dims: "40 × 16 cm", weight: 600, images: img("crimson-pintuck-bolster"),
    variants: [["Standard 16 × 6 in", null, 12], ["Large 24 × 8 in", 2090, 8]],
    blurb: "A cylindrical bolster in rich crimson satin, hand-smocked into a diamond lattice and finished with scalloped ivory ends and a button tie." },
  { slug: "teal-flower-cushion", name: "Peacock-Teal Petal Cushion", cat: "cushions", craft: "Hand Smocking", material: "Satin", colors: ["Teal"], price: 1390, stock: 18, tone: "ink", alt: "sand", artisan: "ramesh-prajapati", badge: "New", featured: true, sold: 39, days: 14, cols: ["soft-furnishings", "gifting-edit"], dims: "Ø 42 cm", weight: 500, images: img("teal-flower-cushion"),
    variants: [["14 inch", null, 10], ["16 inch", 1790, 8]],
    blurb: "A plump round cushion shaped into scalloped petals, in a saturated peacock-teal satin gathered tightly at the heart. A jewel-coloured accent for a neutral sofa." },
  { slug: "silver-pintuck-round-cushion", name: "Silver Smocked Round Cushion", cat: "cushions", craft: "Hand Smocking", material: "Satin", colors: ["Silver", "Ivory"], price: 1590, stock: 14, tone: "ink", alt: "sand", artisan: "ramesh-prajapati", sold: 24, days: 34, cols: ["soft-furnishings"], dims: "Ø 42 cm", weight: 520, images: img("silver-pintuck-round-cushion"),
    variants: [["14 inch", null, 8], ["16 inch", 1990, 6]],
    blurb: "A round cushion smocked in a silvery-grey satin with a scalloped ivory border and a pearl-white centre button — quietly luxurious for a bedroom." },
  { slug: "sunflower-velvet-cushion", name: "Sunflower Velvet Floor Cushion", cat: "cushions", craft: "Hand Stitching", material: "Velvet", colors: ["Black", "Marigold"], price: 1690, stock: 12, tone: "brass", alt: "ink", artisan: "ramesh-prajapati", featured: true, sold: 31, days: 21, cols: ["soft-furnishings", "gifting-edit"], dims: "Ø 50 cm", weight: 700, images: img("sunflower-velvet-cushion"),
    blurb: "A black velvet disc ringed with plump marigold petals and a golden button centre — a sunflower you can sit on. Ideal for a reading nook or kids' room." },

  /* ───────────── Handmade Flowers ───────────── */
  { slug: "paper-rose-basket-bouquet", name: "Burlap Rose Arrangement in Jute Basket", cat: "flowers", craft: "Burlap Flower Craft", material: "Burlap & Jute", colors: ["Cream", "Marigold", "Green"], price: 1890, stock: 9, tone: "sand", alt: "brass", artisan: "lakshmi-bai", badge: "New", sold: 16, days: 12, cols: ["gifting-edit"], dims: "H 55 cm × W 30 cm", weight: 700, images: img("paper-rose-basket-bouquet"),
    blurb: "A lush arrangement of hand-shaped burlap roses in cream and marigold with green leaves and a red organza bow, set in a woven jute basket edged with a colourful braid. Never wilts, never needs water." },
  { slug: "jute-cone-flower-bouquet", name: "Jute-Wrapped Rose Posy", cat: "flowers", craft: "Burlap Flower Craft", material: "Burlap & Jute", colors: ["Pink", "Yellow", "Blue", "Purple"], price: 1290, compare: 1490, stock: 16, tone: "sand", alt: "wine", artisan: "lakshmi-bai", sold: 22, days: 29, cols: ["gifting-edit"], dims: "H 40 cm × W 25 cm", weight: 450, images: img("jute-cone-flower-bouquet"),
    blurb: "A posy of burlap roses in pink, yellow, turquoise and purple, wrapped in a natural jute leaf and standing in a small woven pot. A cheerful, everlasting gift." },

  /* ───────────── Bags & Accessories ───────────── */
  { slug: "madhubani-jute-sling-bag", name: "Madhubani-Embroidered Jute Sling Bag", cat: "bags", craft: "Hand Embroidery", material: "Jute", colors: ["Natural", "Green", "Pink", "Orange"], price: 1590, compare: 1890, stock: 22, tone: "sand", alt: "wine", artisan: "lakshmi-bai", badge: "New", featured: true, sold: 34, days: 11, cols: ["gifting-edit"], dims: "26 × 24 cm, strap 55 cm", weight: 380, images: img("madhubani-jute-sling-bag"),
    blurb: "A natural-jute sling bag embroidered with a lotus, leafy vines and a Madhubani-style fish-bird motif in green, pink and orange. Two zip pockets on the front and a brass-finish hardware." },

  /* ───────────── Pottery & Terracotta ───────────── */
  { slug: "elephant-ear-terracotta-vase", name: "Carved Terracotta Vase with Elephant Ears", cat: "pottery", craft: "Carved Terracotta", material: "Terracotta", colors: ["Terracotta"], price: 3990, stock: 5, tone: "clay", alt: "sand", artisan: "sunita-kumhar", badge: "New", featured: true, sold: 9, days: 6, cols: ["gifting-edit"], dims: "H 60 cm × Ø 18 cm", weight: 2400, images: img("elephant-ear-terracotta-vase"),
    blurb: "A tall, slender vase with a frilled rim and a pair of tiny elephant-ear charms, its lower body pierced and carved with swirling leaves. Stunning alone or filled with dried pampas." },
];

/** Portrait stand-in for each artisan until real photos exist: one of their own pieces. */
export const ARTISAN_IMAGE: Record<string, string> = {
  "meera-devi": "/catalog/madhubani-framed-panel.webp",
  "sunita-kumhar": "/catalog/elephant-ear-terracotta-vase.webp",
  "lakshmi-bai": "/catalog/madhubani-jute-sling-bag.webp",
  "farida-begum": "/catalog/red-mirror-mosaic-plate.webp",
  "ramesh-prajapati": "/catalog/teal-flower-cushion.webp",
  "anita-sharma": "/catalog/golden-tree-of-life-frame.webp",
};
