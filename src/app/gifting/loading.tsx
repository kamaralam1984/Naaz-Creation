export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12" role="status" aria-label="Loading">
      <div className="h-3 w-24 animate-pulse bg-beige" />
      <div className="mt-5 h-12 w-2/3 max-w-xl animate-pulse bg-beige" />
      <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[4/5] animate-pulse bg-beige" />)}</div>
    </div>
  );
}
