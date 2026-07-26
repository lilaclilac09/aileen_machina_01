/**
 * Build entrypoint for local and Vercel.
 *
 * Chooses the Prisma provider, generates the client, syncs the schema when a
 * real database is reachable, then builds Next. Missing or unreachable
 * database config degrades to a deployable site that reports the problem at
 * /api/health rather than failing the build.
 */
import { spawnSync } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const PLACEHOLDER_URL =
  "postgresql://placeholder:placeholder@localhost:5432/placeholder";

const schemaPath = resolve(process.cwd(), "prisma/schema.prisma");
const onVercel = process.env.VERCEL === "1";

/** Node does not read .env; Prisma CLI does. Match it so local builds agree. */
function loadDotEnv() {
  if (process.env.DATABASE_URL) return;
  for (const file of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const match = line.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/);
      if (!match) continue;
      process.env.DATABASE_URL = match[1].trim().replace(/^["']|["']$/g, "");
      return;
    }
  }
}

loadDotEnv();
const rawUrl = (process.env.DATABASE_URL || "").trim();
const isPostgres = /^postgres(ql)?:\/\//i.test(rawUrl);
const isSqlite = /^file:/i.test(rawUrl);

function setProvider(provider) {
  const schema = readFileSync(schemaPath, "utf8");
  const next = schema.replace(
    /provider\s*=\s*"(sqlite|postgresql)"/,
    `provider = "${provider}"`
  );
  if (next !== schema) writeFileSync(schemaPath, next);
  console.log(`[build] prisma provider: ${provider}`);
}

function run(command, args, env) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: { ...process.env, ...env },
    shell: process.platform === "win32",
  });
  return result.status ?? 1;
}

let usableUrl = rawUrl;

if (isPostgres) {
  setProvider("postgresql");
} else if (isSqlite && !onVercel) {
  setProvider("sqlite");
} else {
  setProvider("postgresql");
  usableUrl = PLACEHOLDER_URL;
  console.warn(`
[build] DATABASE_URL is missing or not a Postgres URI.

Set it in Vercel → Settings → Environment Variables (Production + Preview):
  DATABASE_URL = postgresql://user:pass@ep-xxxx.aws.neon.tech/neondb?sslmode=require

Building with a placeholder so the deploy succeeds; open /api/health afterwards
to confirm what is still missing.
`);
}

const buildEnv = { DATABASE_URL: usableUrl };

const generated = run("npx", ["prisma", "generate"], buildEnv);
if (generated !== 0) {
  console.error("[build] prisma generate failed");
  process.exit(generated);
}

if (usableUrl !== PLACEHOLDER_URL) {
  const pushed = run(
    "npx",
    ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"],
    buildEnv
  );
  if (pushed !== 0) {
    console.warn(`
[build] schema sync failed — deploy continues.
Run "npx prisma db push" against DATABASE_URL, or check the Neon branch is
active. /api/health reports live database status.
`);
  }
} else {
  console.warn("[build] skipping schema sync (placeholder database URL)");
}

process.exit(run("npx", ["next", "build"], buildEnv));
