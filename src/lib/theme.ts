import { cookies } from "next/headers";

/** Storefront themes. 1 = original ivory/burgundy design, 2 = green & gold marketplace design. */
export const THEME_COOKIE = "naaz_theme";
export type Theme = "1" | "2";
export const DEFAULT_THEME: Theme = "2";

export async function getTheme(): Promise<Theme> {
  const v = (await cookies()).get(THEME_COOKIE)?.value;
  return v === "1" || v === "2" ? v : DEFAULT_THEME;
}
