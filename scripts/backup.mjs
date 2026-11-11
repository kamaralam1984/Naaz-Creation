// Consistent online backup of the SQLite database (safe while the site is running).
// Usage: node scripts/backup.mjs [destDir]   — keeps the newest 14 backups.
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const src = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "karigar.db");
const dir = process.argv[2] ?? path.join(path.dirname(src), "backups");
fs.mkdirSync(dir, { recursive: true });
const out = path.join(dir, `karigar-${new Date().toISOString().replace(/[:.]/g, "-")}.db`);
const db = new DatabaseSync(src);
db.exec(`VACUUM INTO '${out.replace(/'/g, "''")}'`);
db.close();
const all = fs.readdirSync(dir).filter((f) => f.startsWith("karigar-") && f.endsWith(".db")).sort();
for (const old of all.slice(0, Math.max(0, all.length - 14))) fs.unlinkSync(path.join(dir, old));
console.log("Backup written:", out);
