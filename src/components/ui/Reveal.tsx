"use client";
import { motion } from "framer-motion";
import { fadeUp, viewport } from "@/lib/motion";

/** Reveal-on-scroll wrapper. */
export function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div className={className} variants={fadeUp} initial="hidden" whileInView="show" viewport={viewport} transition={{ delay }}>
      {children}
    </motion.div>
  );
}
