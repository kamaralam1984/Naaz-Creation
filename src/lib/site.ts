export const site = {
  name: "Nazi Creation",
  tagline: "Handcrafted by India's master artisans",
  description:
    "Luxury handcrafted home décor, golden straw art, Madhubani paintings, mirror-work, hand-smocked cushions and heirloom gifts — made by hand, delivered worldwide.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};

export type NavChild = { label: string; href: string };
export type NavGroup = { label: string; href: string; only?: "2"; columns?: { title: string; links: NavChild[] }[] };

export const nav: NavGroup[] = [
  { label: "Home", href: "/", only: "2" },
  {
    label: "Shop",
    href: "/shop",
    columns: [
      { title: "Art & Mirrors", links: [
        { label: "Golden Straw & Zardozi", href: "/collections/golden-straw" },
        { label: "Mirror & Mosaic", href: "/collections/mirror-mosaic" },
        { label: "Pottery & Terracotta", href: "/category/pottery" },
      ]},
      { title: "Soft Furnishings & Walls", links: [
        { label: "Cushions & Bolsters", href: "/category/cushions" },
        { label: "Wall Hangings & Plates", href: "/category/wall-hangings" },
        { label: "Framed Art & Paintings", href: "/category/framed-art" },
      ]},
      { title: "Everlasting Flowers", links: [
        { label: "Handmade Flowers", href: "/category/flowers" },
        { label: "New Arrivals", href: "/new-arrivals" },
        { label: "Best Sellers", href: "/best-sellers" },
      ]},
    ],
  },
  { label: "Collections", href: "/collections", columns: [
    { title: "Featured", links: [
      { label: "Golden Straw & Zardozi", href: "/collections/golden-straw" },
      { label: "Mirror & Mosaic", href: "/collections/mirror-mosaic" },
      { label: "Soft Furnishings", href: "/collections/soft-furnishings" },
    ]},
    { title: "Curated", links: [
      { label: "Wall Stories", href: "/collections/wall-stories" },
      { label: "The Gifting Edit", href: "/collections/gifting-edit" },
      { label: "All Collections", href: "/collections" },
    ]},
  ]},
  { label: "Gifting", href: "/gifting", columns: [
    { title: "Gifting", links: [
      { label: "Corporate Gifting", href: "/gifting/corporate" },
      { label: "Custom Hampers", href: "/gifting/hampers" },
      { label: "Shop by Occasion", href: "/gifting/occasions" },
    ]},
  ]},
  { label: "Our Artisans", href: "/artisans" },
  { label: "Our Story", href: "/about" },
];
