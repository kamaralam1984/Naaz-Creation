"use client";
import { motion } from "framer-motion";
import { pageTransition } from "@/lib/motion";

/** template.tsx remounts per navigation → elegant page transition. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <motion.div variants={pageTransition} initial="hidden" animate="show">{children}</motion.div>;
}
