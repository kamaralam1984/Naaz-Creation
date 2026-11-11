/**
 * SAMPLE CONTENT — placeholder names, prices and copy for building the UI.
 * Replace with real catalog data (Phase 3+ database) before launch.
 */
export type Tone = "clay" | "brass" | "wine" | "sand" | "ink";

export type SampleProduct = {
  slug: string;
  name: string;
  craft: string;
  price: number;
  compareAt?: number;
  rating: number;
  reviews: number;
  badge?: "Best Seller" | "New" | "Sale";
  tone: Tone;
  altTone: Tone;
};

export const bestSellers: SampleProduct[] = [
  { slug: "hammered-copper-bottle", name: "Hammered Copper Bottle", craft: "Copper", price: 1899, compareAt: 2399, rating: 4.8, reviews: 214, badge: "Best Seller", tone: "clay", altTone: "brass" },
  { slug: "dokra-dancing-figure", name: "Dokra Dancing Figure", craft: "Dokra Brass", price: 3450, rating: 4.9, reviews: 98, badge: "Best Seller", tone: "brass", altTone: "ink" },
  { slug: "terracotta-urn", name: "Terracotta Table Urn", craft: "Terracotta", price: 2250, compareAt: 2750, rating: 4.7, reviews: 76, tone: "wine", altTone: "clay" },
  { slug: "hand-painted-coaster-set", name: "Hand-painted Coaster Set", craft: "Coasters", price: 1250, rating: 4.6, reviews: 143, tone: "sand", altTone: "brass" },
];

export const newArrivals: SampleProduct[] = [
  { slug: "mango-wood-serving-tray", name: "Mango Wood Serving Tray", craft: "Wooden Trays", price: 2790, rating: 4.8, reviews: 12, badge: "New", tone: "ink", altTone: "clay" },
  { slug: "madhubani-wall-panel", name: "Madhubani Wall Panel", craft: "Paintings", price: 5200, rating: 5, reviews: 6, badge: "New", tone: "wine", altTone: "sand" },
  { slug: "jute-market-tote", name: "Jute Market Tote", craft: "Jute Bags", price: 1450, rating: 4.5, reviews: 18, badge: "New", tone: "sand", altTone: "ink" },
  { slug: "brass-diya-set", name: "Brass Diya Set of 4", craft: "Dokra Brass", price: 1950, compareAt: 2300, rating: 4.7, reviews: 31, badge: "Sale", tone: "brass", altTone: "wine" },
];

export const collections = [
  { label: "The Heirloom Edit", blurb: "Pieces made to be passed down.", href: "/collections", tone: "wine" },
  { label: "Festive Table", blurb: "Serveware for gatherings.", href: "/collections", tone: "brass" },
  { label: "Earth & Clay", blurb: "Terracotta in warm, quiet tones.", href: "/collections", tone: "clay" },
] as const;

export const offers = [
  { title: "Welcome — 10% off", body: "On your first order over ₹2,000.", code: "WELCOME10" },
  { title: "Free shipping", body: "On all India orders above ₹3,000.", code: "SHIPFREE" },
  { title: "Gift with every hamper", body: "A hand-painted card, on us.", code: "HAMPER" },
] as const;

export const artisans = [
  { name: "Meera Devi", craft: "Madhubani painter", place: "Bihar", quote: "Every line is drawn the way my grandmother taught me.", tone: "wine" },
  { name: "Ratan Sarkar", craft: "Dokra metal caster", place: "West Bengal", quote: "The wax decides the shape; I only listen.", tone: "brass" },
  { name: "Imran Ali", craft: "Copper smith", place: "Rajasthan", quote: "A hammer made every dent. None is a mistake.", tone: "clay" },
] as const;

export const crafts = [
  { label: "Dokra", region: "West Bengal · Odisha", tone: "brass" },
  { label: "Madhubani", region: "Bihar", tone: "wine" },
  { label: "Terracotta", region: "Bankura · Molela", tone: "clay" },
  { label: "Copper Ware", region: "Rajasthan · Uttar Pradesh", tone: "ink" },
] as const;

export const occasions = [
  { label: "Weddings", tone: "wine" },
  { label: "Diwali", tone: "brass" },
  { label: "Housewarming", tone: "clay" },
  { label: "Anniversaries", tone: "sand" },
  { label: "Corporate", tone: "ink" },
] as const;

export const testimonials = [
  { quote: "The golden straw frame looks even better on the wall than in the photos. Beautifully packed, too.", name: "Ananya R.", city: "Bengaluru" },
  { quote: "We sent mirror-work plates as client gifts. Every single one was appreciated.", name: "Vikram S.", city: "Mumbai" },
  { quote: "Real craftsmanship — you can see the maker's hand in the details.", name: "Priya K.", city: "London" },
] as const;

export const gallery: Tone[] = ["clay", "sand", "wine", "brass", "ink", "clay", "brass", "sand"];

export const formatPrice = (n: number) => `₹${n.toLocaleString("en-IN")}`;
