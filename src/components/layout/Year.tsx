"use client";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
/** Current year, resolved on the client (server snapshot is a stable fallback). */
export function Year() {
  const y = useSyncExternalStore(subscribe, () => String(new Date().getFullYear()), () => "2026");
  return <>{y}</>;
}
