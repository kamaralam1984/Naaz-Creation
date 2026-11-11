import type { Transition, Variants } from "framer-motion";

/** Animation standards — every animated component uses these. */
export const ease = [0.22, 1, 0.36, 1] as const;

export const duration = { fast: 0.2, base: 0.4, slow: 0.9 } as const;

export const transition: Transition = { duration: duration.slow, ease };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition },
};

export const stagger = (gap = 0.1, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});

export const viewport = { once: true, margin: "-80px" } as const;

export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};
