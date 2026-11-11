"use client";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";

/** Floating WhatsApp enquiry button (bottom-right). Mounted in the root layout. */
export function WhatsAppButton({ number }: { number: string }) {
  const path = usePathname();
  if (!number || path.startsWith("/admin") || path.startsWith("/checkout")) return null;
  const text = encodeURIComponent(`Hello! I'd like to know more about a piece${path.startsWith("/product/") ? ` (${path})` : ""}.`);
  return (
    <a data-floating href={`https://wa.me/${number}?text=${text}`} target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp"
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 lg:bottom-5 lg:right-5 z-[60] flex h-12 items-center gap-2 rounded-full bg-[#1f6b4a] px-4 text-ivory shadow-[var(--shadow-lift)] transition-transform hover:scale-105 focus-visible:outline-offset-4">
      <MessageCircle size={20} aria-hidden /><span className="hidden text-xs uppercase tracking-[0.16em] sm:inline">Chat</span>
    </a>
  );
}
