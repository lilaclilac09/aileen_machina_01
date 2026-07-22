/**
 * Generate ADMIN_PASSWORD_HASH for Vercel env.
 *
 * Usage:
 *   npx tsx scripts/hash-admin-password.ts 'your-new-strong-password'
 *
 * Then set on Vercel o6o4:
 *   ADMIN_PASSWORD_HASH=<printed value>
 *   SESSION_SECRET=<long random string>
 * Remove or leave blank ADMIN_PASSWORD after hash works.
 * Redeploy — old sessions die when SESSION_SECRET changes.
 */
import { hashAdminPassword } from "../lib/auth";
import { randomBytes } from "crypto";

const password = process.argv[2];
if (!password || password.length < 10) {
  console.error("Usage: npx tsx scripts/hash-admin-password.ts '<password ≥10 chars>'");
  process.exit(1);
}

const hash = hashAdminPassword(password);
const sessionSecret = randomBytes(32).toString("base64url");

console.log("\nPaste these into Vercel → aileen-machina-01-o6o4 → Environment Variables:\n");
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
console.log(`SESSION_SECRET=${sessionSecret}`);
console.log("\nThen: remove ADMIN_PASSWORD (or leave empty), Redeploy.");
console.log("Rotating SESSION_SECRET logs everyone out (intended after a breach).\n");
