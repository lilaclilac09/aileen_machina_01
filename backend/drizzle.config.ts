import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  driver: "pg",              // ← 必须是 "pg"
  dialect: "postgresql",     // ← 必须是 "postgresql"
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
