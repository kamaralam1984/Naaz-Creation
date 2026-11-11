"use client";
import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { submitReview, type ReviewState } from "@/app/product/[slug]/actions";
import { Notice } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { dateFmt } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Review } from "@/server/types";

export function Stars({ value, size = 15 }: { value: number; size?: number }) {
  return <span className="inline-flex" role="img" aria-label={`${value} out of 5 stars`}>{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={size} className={n <= Math.round(value) ? "fill-champagne text-champagne" : "text-charcoal/25"} />)}</span>;
}

export function Reviews({ productId, reviews, avg, count, signedIn, userName }: { productId: number; reviews: Review[]; avg: number; count: number; signedIn: boolean; userName?: string }) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(submitReview, {});
  const [rating, setRating] = useState(5);
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: reviews.filter((r) => r.rating === n).length }));
  return (
    <div className="grid gap-12 lg:grid-cols-[320px_1fr]">
      <div>
        {count > 0 ? (
          <>
            <p className="font-serif text-6xl">{avg.toFixed(1)}</p>
            <Stars value={avg} size={18} /><p className="mt-1 text-sm text-charcoal/60">{count} review{count > 1 ? "s" : ""}</p>
            <ul className="mt-5 space-y-1.5">{dist.map(({ n, c }) => <li key={n} className="flex items-center gap-3 text-xs"><span className="w-6">{n}★</span><span className="h-1.5 flex-1 bg-beige"><span className="block h-full bg-champagne-deep" style={{ width: `${count ? (c / reviews.length) * 100 : 0}%` }} /></span><span className="w-5 text-right text-charcoal/60">{c}</span></li>)}</ul>
          </>
        ) : <p className="font-serif text-2xl">No reviews yet</p>}
        <form action={action} className="mt-8 space-y-4 border-t border-charcoal/10 pt-6">
          <h3 className="font-serif text-2xl">Write a review</h3>
          {!signedIn ? <p className="text-sm text-charcoal/70"><a className="underline" href="/login?next=%2F">Sign in</a> to share your experience.</p> : state.ok ? <Notice tone="success">Thank you! Your review will appear once approved.</Notice> : (
            <>
              <input type="hidden" name="productId" value={productId} /><input type="hidden" name="rating" value={rating} />
              <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
              <fieldset><legend className="eyebrow mb-2">Your rating</legend><div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`} aria-pressed={rating === n}><Star size={26} className={cn(n <= rating ? "fill-champagne text-champagne" : "text-charcoal/30")} /></button>)}</div></fieldset>
              <div><label className="eyebrow mb-1 block" htmlFor="rv-name">Name</label><input id="rv-name" name="name" defaultValue={userName} required className="h-11 w-full border border-charcoal/25 bg-transparent px-3 text-sm" /></div>
              <div><label className="eyebrow mb-1 block" htmlFor="rv-title">Title</label><input id="rv-title" name="title" className="h-11 w-full border border-charcoal/25 bg-transparent px-3 text-sm" /></div>
              <div><label className="eyebrow mb-1 block" htmlFor="rv-body">Review</label><textarea id="rv-body" name="body" required minLength={10} className="min-h-28 w-full border border-charcoal/25 bg-transparent p-3 text-sm" /></div>
              {state.error && <Notice tone="error">{state.error}</Notice>}
              <Button disabled={pending}>{pending ? "Submitting…" : "Submit review"}</Button>
            </>
          )}
        </form>
      </div>
      <ul className="divide-y divide-charcoal/10">
        {reviews.map((r) => (
          <li key={r.id} className="py-6 first:pt-0">
            <div className="flex flex-wrap items-center gap-3"><Stars value={r.rating} /><span className="text-sm font-medium">{r.name}</span>{r.verified ? <span className="text-[0.65rem] uppercase tracking-[0.16em] text-champagne-deep">Verified purchase</span> : null}<span className="text-xs text-charcoal/50">{dateFmt(r.created_at)}</span></div>
            {r.title && <p className="mt-2 font-serif text-xl">{r.title}</p>}
            <p className="mt-2 text-sm leading-relaxed text-charcoal/80">{r.body}</p>
          </li>
        ))}
        {!reviews.length && <li className="text-sm text-charcoal/60">Be the first to review this piece.</li>}
      </ul>
    </div>
  );
}
