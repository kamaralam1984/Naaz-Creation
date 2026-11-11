import type { MetadataRoute } from "next";

/** Makes the storefront installable ("Add to Home Screen") and opens it like a native app, without browser chrome. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Naaz Creation — Handcrafted by India's master artisans",
    short_name: "Naaz Creation",
    description: "Handcrafted Indian home décor, art and gifts.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f3d2e",
    theme_color: "#0f3d2e",
    categories: ["shopping", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Shop", url: "/shop", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "My Bag", url: "/cart", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
