import { Container } from "@/components/ui/Container";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pattern-diamond relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-champagne/20 blur-3xl" />
      <Container className="relative flex justify-center py-16 lg:py-24">
        <div className="gold-corners w-full max-w-md rounded-md border border-champagne/40 bg-white/75 p-8 shadow-[var(--shadow-lift)] backdrop-blur sm:p-10">
          <span aria-hidden className="gold-line absolute inset-x-8 top-0 h-px" />{children}
        </div>
      </Container>
    </div>
  );
}
