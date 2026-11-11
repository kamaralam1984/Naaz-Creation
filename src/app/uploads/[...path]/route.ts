import fs from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads");
const MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif", mp4: "video/mp4", webm: "video/webm" };

export async function GET(_: Request, ctx: RouteContext<"/uploads/[...path]">) {
  const { path: parts } = await ctx.params;
  const rel = parts.join("/");
  const ext = rel.split(".").pop()?.toLowerCase() ?? "";
  const full = path.resolve(UPLOAD_DIR, rel);
  if (!MIME[ext] || !/^[\w./-]+$/.test(rel) || rel.includes("..") || !full.startsWith(path.resolve(UPLOAD_DIR) + path.sep)) return new Response("Not found", { status: 404 });
  try {
    const data = await fs.readFile(full);
    return new Response(new Uint8Array(data), { headers: { "Content-Type": MIME[ext], "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
  } catch { return new Response("Not found", { status: 404 }); }
}
