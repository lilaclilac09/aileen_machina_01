/**
 * On Vercel / prod, DATABASE_URL is Postgres → rewrite Prisma provider.
 * Local keeps SQLite (file:...).
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const schemaPath = resolve(process.cwd(), "prisma/schema.prisma");
const url = process.env.DATABASE_URL || "";
let schema = readFileSync(schemaPath, "utf8");

if (/^postgres(ql)?:\/\//i.test(url)) {
  if (schema.includes('provider = "sqlite"')) {
    schema = schema.replace('provider = "sqlite"', 'provider = "postgresql"');
    writeFileSync(schemaPath, schema);
    console.log("[ensure-prisma-provider] switched to postgresql");
  } else {
    console.log("[ensure-prisma-provider] already postgresql");
  }
} else {
  console.log("[ensure-prisma-provider] keeping sqlite (local)");
}
