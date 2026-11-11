export function Prose({ children }: { children: React.ReactNode }) {
  return <div className="max-w-3xl space-y-5 leading-relaxed text-charcoal/80 [&_a]:underline [&_h2]:mt-12 [&_h2]:font-serif [&_h2]:text-3xl [&_h2]:text-charcoal [&_h3]:mt-6 [&_h3]:font-serif [&_h3]:text-xl [&_h3]:text-charcoal [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_strong]:text-charcoal">{children}</div>;
}
