"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { ChevronDown, Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/Container";
import { SearchOverlay } from "@/components/layout/SearchOverlay";
import { useStore } from "@/components/providers/StoreProvider";
import { nav } from "@/lib/site";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/cn";

export function Header() {
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, cartCount, wishlist, openDrawer } = useStore();
  const pathname = usePathname();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.4 });

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    document.body.style.overflow = mobile ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobile]);
  useEffect(() => {
    document.body.classList.toggle("overlay-open", mobile || searchOpen);
    return () => document.body.classList.remove("overlay-open");
  }, [mobile, searchOpen]);

  const active = nav.find((n) => n.label === open && n.columns);

  return (
    <header
      onMouseLeave={() => setOpen(null)}
      onKeyDown={(e) => e.key === "Escape" && setOpen(null)}
      className={cn("sticky top-0 z-50 transition-all duration-[500ms]", scrolled ? "bg-[color-mix(in_srgb,var(--header-bg)_88%,transparent)] shadow-[0_10px_30px_-14px_rgb(0_0_0/0.4)] backdrop-blur-xl backdrop-saturate-150" : "bg-[color:var(--header-bg)]", "text-[color:var(--header-fg)]")}
    >
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-champagne/30" />
      <motion.span aria-hidden style={{ scaleX: progress }} className="gold-line absolute inset-x-0 bottom-0 h-[2px] origin-left" />
      <Container className={cn("flex items-center justify-between transition-all duration-[400ms]", scrolled ? "h-16" : "h-20")}>
        <button className="lg:hidden -ml-2 p-2" aria-label="Open menu" onClick={() => setMobile(true)}><Menu size={22} /></button>

        <Logo tone="current" className="max-lg:absolute max-lg:left-1/2 max-lg:-translate-x-1/2" />

        <nav aria-label="Primary" className="hidden lg:flex items-center gap-9">
          {nav.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              onMouseEnter={() => setOpen(n.label)}
              onFocus={() => setOpen(n.label)}
              aria-expanded={n.columns ? open === n.label : undefined}
              aria-current={n.href === "/" ? (pathname === "/" ? "page" : undefined) : pathname.startsWith(n.href) ? "page" : undefined}
              className={cn("nav-link group inline-flex items-center gap-1 py-2 text-[0.82rem] font-medium tracking-wide transition-colors duration-300 hover:text-[color:var(--header-accent)] aria-[current=page]:text-[color:var(--header-accent)]", n.only === "2" && "only-t2")}
            >
              {n.label}{n.columns && <ChevronDown size={13} aria-hidden className="transition-transform duration-300 group-hover:rotate-180" />}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-3">
          <button aria-label="Search" onClick={() => setSearchOpen(true)} className="p-2 transition-transform duration-300 hover:scale-110 hover:text-[color:var(--header-accent)]"><Search size={20} /></button>
          <Link href="/account/wishlist" aria-label={`Wishlist (${wishlist.length})`} className="relative hidden p-2 sm:block">
            <Heart size={20} />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-champagne px-1 text-[0.6rem] font-semibold text-charcoal" aria-hidden>{wishlist.length}</span>
          </Link>
          <Link href={user ? "/account" : "/login"} aria-label={user ? "My account" : "Sign in"} className="hidden p-2 sm:block"><User size={20} /></Link>
          <button aria-label={`Open bag (${cartCount} items)`} onClick={openDrawer} className="relative p-2">
            <ShoppingBag size={20} />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-champagne px-1 text-[0.6rem] font-semibold text-charcoal">{cartCount}</span>
          </button>
        </div>
      </Container>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Mega menu */}
      <AnimatePresence>
        {active && (
          <motion.div
            key="mega"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease }}
            className="absolute inset-x-0 top-full hidden overflow-hidden text-charcoal border-t border-champagne/40 bg-ivory/95 shadow-[var(--shadow-lift)] backdrop-blur-xl lg:block"
          >
            <motion.span aria-hidden initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.9, ease }} className="gold-line absolute inset-x-0 top-0 h-px origin-left" />
            <div aria-hidden className="pattern-diamond pointer-events-none absolute inset-0 opacity-60" />
            <Container className="relative grid grid-cols-4 gap-12 py-12">
              {active.columns!.map((c, ci) => (
                <motion.div key={c.title} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease, delay: 0.08 + ci * 0.08 }}>
                  <p className="eyebrow mb-5 flex items-center gap-3"><span aria-hidden className="h-1.5 w-1.5 rotate-45 bg-champagne" />{c.title}</p>
                  <ul className="space-y-3">
                    {c.links.map((l) => (
                      <li key={l.href}><Link href={l.href} onClick={() => setOpen(null)} className="group/l inline-flex items-center gap-2 font-serif text-xl transition-all duration-300 hover:translate-x-1.5 hover:text-burgundy"><span aria-hidden className="h-px w-0 bg-champagne transition-all duration-300 group-hover/l:w-4" />{l.label}</Link></li>
                    ))}
                  </ul>
                </motion.div>
              ))}
              <Link href="/collections/golden-straw" onClick={() => setOpen(null)} className="gold-corners group relative col-start-4 row-start-1 block overflow-hidden bg-gradient-to-br from-beige to-[#dccfb8] p-8">
                <p className="eyebrow">Featured</p>
                <p className="relative z-10 mt-3 max-w-[7ch] font-serif text-3xl leading-tight">The Golden Straw Edit</p>
                <span className="mt-5 inline-block text-xs uppercase tracking-[0.2em] text-champagne-deep">Explore →</span>
                <Image src="/catalog/golden-tree-of-life-frame.webp" alt="" width={220} height={260} className="absolute -bottom-8 -right-8 w-36 rotate-6 drop-shadow-xl transition-transform duration-700 group-hover:-translate-y-2 group-hover:rotate-3 group-hover:scale-105" />
              </Link>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobile && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-charcoal/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobile(false)} />
            <motion.aside
              role="dialog" aria-modal="true" aria-label="Menu"
              className="pattern-diamond fixed inset-y-0 left-0 z-50 flex w-[86%] text-charcoal max-w-sm flex-col border-r border-champagne/40 bg-ivory p-6"
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ duration: 0.5, ease }}
            >
              <div className="flex items-center justify-between"><Logo /><button aria-label="Close menu" onClick={() => setMobile(false)} className="p-2"><X size={22} /></button></div>
              <nav className="mt-10 flex-1 space-y-1 overflow-y-auto">
                {nav.map((n, ni) => (
                  <motion.div key={n.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease, delay: 0.15 + ni * 0.07 }} className="relative border-b border-champagne/30 py-4">
                    <Link href={n.href} onClick={() => setMobile(false)} className="font-serif text-3xl">{n.label}</Link>
                    {n.columns && (
                      <ul className="mt-3 grid grid-cols-1 gap-2 pl-1">
                        {n.columns.flatMap((c) => c.links).map((l) => (
                          <li key={l.href}><Link href={l.href} onClick={() => setMobile(false)} className="text-sm text-charcoal/70">{l.label}</Link></li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                ))}
              </nav>
              <div className="flex gap-6 pt-6 text-xs uppercase tracking-[0.2em]">
                <Link href={user ? "/account" : "/login"} onClick={() => setMobile(false)}>{user ? "Account" : "Sign in"}</Link>
                <Link href="/account/wishlist" onClick={() => setMobile(false)}>Wishlist</Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
