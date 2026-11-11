import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/engagement/WhatsAppButton";
import { StoreProvider } from "@/components/providers/StoreProvider";
import { getUser } from "@/server/auth";
import { getSettings } from "@/server/settings";
import { getTheme } from "@/lib/theme";
import { ThemeSwitcher } from "@/components/layout/ThemeSwitcher";
import { site } from "@/lib/site";

const cormorant = Cormorant_Garamond({ variable: "--font-cormorant", subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], display: "swap" });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.tagline}`, template: `%s | ${site.name}` },
  description: site.description,
  openGraph: { type: "website", siteName: site.name, title: `${site.name} — ${site.tagline}`, description: site.description },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};
export const viewport: Viewport = { themeColor: "#F8F5EF" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [user, s, theme] = [await getUser(), getSettings(), await getTheme()];
  let rates: Record<string, number> = { INR: 1 };
  try { rates = JSON.parse(s.currency_rates); } catch {}
  return (
    <html lang="en" data-theme={theme} className={`${cormorant.variable} ${inter.variable} h-full`}>
      <body id="top" className="flex min-h-full flex-col">
        <StoreProvider user={user ? { id: user.id, name: user.name, email: user.email, role: user.role } : null} rates={rates}>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-charcoal focus:px-4 focus:py-2 focus:text-ivory">Skip to content</a>
          {s.announcement && <AnnouncementBar text={s.announcement} />}
          <Header />
          <main id="main" className="flex-1">{children}</main>
          <WhatsAppButton number={s.whatsapp_number} />
          {process.env.NEXT_PUBLIC_THEME_SWITCHER !== "off" && <ThemeSwitcher theme={theme} />}
          <Footer social={{ instagram: s.instagram, facebook: s.facebook, pinterest: s.pinterest, youtube: s.youtube }} whatsapp={s.whatsapp_number} />
        </StoreProvider>
      </body>
    </html>
  );
}
