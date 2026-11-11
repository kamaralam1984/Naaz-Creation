import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { getUser } from "@/server/auth";
import { sameOrigin } from "@/server/security";

export const dynamic = "force-dynamic";
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads");

const TYPES: Record<string, { ext: string; max: number }> = {
  "image/jpeg": { ext: "jpg", max: 6e6 }, "image/png": { ext: "png", max: 6e6 }, "image/webp": { ext: "webp", max: 6e6 }, "image/avif": { ext: "avif", max: 6e6 },
  "video/mp4": { ext: "mp4", max: 60e6 }, "video/webm": { ext: "webm", max: 60e6 },
};
// Magic-byte sniffing so a renamed file can't masquerade as an image.
function sniff(b: Buffer): string | null {
  if (b[0] === 0xff && b[1] === 0xd8) return "image/jpeg";
  if (b.subarray(1, 4).toString() === "PNG") return "image/png";
  if (b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP") return "image/webp";
  if (b.subarray(4, 12).toString().startsWith("ftypavif")) return "image/avif";
  if (b.subarray(4, 8).toString() === "ftyp") return "video/mp4";
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return "video/webm";
  return null;
}

/** Staff/admin only. Returns { url } for use in product.images / video_url / logo etc. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const u = await getUser();
  if (!u || u.role === "customer") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const file = (await req.formData().catch(() => null))?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniff(buf);
  const rule = type ? TYPES[type] : undefined;
  if (!type || !rule) return NextResponse.json({ error: "Unsupported file type. Use JPG, PNG, WebP, AVIF, MP4 or WebM." }, { status: 415 });
  if (buf.length > rule.max) return NextResponse.json({ error: `File too large (max ${Math.round(rule.max / 1e6)} MB).` }, { status: 413 });
  const d = new Date();
  const rel = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${randomBytes(8).toString("hex")}.${rule.ext}`;
  await fs.mkdir(path.dirname(path.join(UPLOAD_DIR, rel)), { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, rel), buf);
  return NextResponse.json({ url: `/uploads/${rel}`, type });
}
