/**
 * On Vercel / prod, DATABASE_URL is Postgres → rewrite Prisma provider.
 * Local keeps SQLite (file:...).
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const schemaPath = resolve(process.cwd(), "prisma/schema.prisma");
const url = (process.env.DATABASE_URL || "").trim();
const onVercel = process.env.VERCEL === "1";

if (!url) {
  console.error(`
[ensure-prisma-provider] DATABASE_URL is missing.

On Vercel → Project → Settings → Environment Variables, add:
  DATABASE_URL = your Neon postgres URI
  (postgresql://user:pass@ep-xxxx.aws.neon.tech/neondb?sslmode=require)

Then Redeploy. See album/DEPLOY.md
`);
  if (onVercel) process.exit(1);
}

let schema = readFileSync(schemaPath, "utf8");

if (/^postgres(ql)?:\/\//i.test(url)) {
  if (schema.includes('provider = "sqlite"')) {
    schema = schema.replace('provider = "sqlite"', 'provider = "postgresql"');
    writeFileSync(schemaPath, schema);
    console.log("[ensure-prisma-provider] switched to postgresql");
  } else {
    console.log("[ensure-prisma-provider] already postgresql");
  }
} else if (onVercel) {
  console.error(`
[ensure-prisma-provider] On Vercel, DATABASE_URL must be a Postgres URI (Neon),
not SQLite file:./dev.db. Current value does not look like postgresql://…
`);
  process.exit(1);
} else {
  console.log("[ensure-prisma-provider] keeping sqlite (local)");
}
