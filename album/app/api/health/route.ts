import { prisma } from "@/lib/db";
import { jsonOk } from "@/lib/http";
import { storageDriver } from "@/lib/storage";
import dbSync from "@/lib/db-sync-status.json";
import { databaseUrlCheck } from "@/lib/env";

export const dynamic = "force-dynamic";

type Check = { ok: boolean; detail: string };

function envCheck(): Record<string, Check> {
  const driver = storageDriver();

  const checks: Record<string, Check> = {
    DATABASE_URL: databaseUrlCheck(process.env.DATABASE_URL),
    ADMIN_COOKIE_SECRET: process.env.ADMIN_COOKIE_SECRET
      ? { ok: true, detail: "set" }
      : { ok: false, detail: "missing — admin cookies are insecure" },
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
      ? { ok: true, detail: process.env.NEXT_PUBLIC_APP_URL }
      : { ok: false, detail: "missing — share links fall back to localhost" },
    STORAGE_DRIVER: { ok: true, detail: driver },
  };

  if (driver === "blob") {
    checks.BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN
      ? { ok: true, detail: "set" }
      : { ok: false, detail: "missing — uploads will fail" };
  }
  if (driver === "r2" || driver === "dual") {
    const r2 =
      process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET &&
      process.env.R2_PUBLIC_BASE_URL;
    checks.R2 = r2 ? { ok: true, detail: "set" } : { ok: false, detail: "incomplete" };
  }
  if (driver === "dual") {
    const oss =
      process.env.OSS_REGION &&
      process.env.OSS_ACCESS_KEY_ID &&
      process.env.OSS_ACCESS_KEY_SECRET &&
      process.env.OSS_BUCKET &&
      process.env.OSS_PUBLIC_BASE_URL;
    checks.OSS = oss ? { ok: true, detail: "set" } : { ok: false, detail: "incomplete" };
  }

  return checks;
}

export async function GET() {
  const env = envCheck();

  let database: Check;
  try {
    const count = await prisma.album.count();
    database = { ok: true, detail: `reachable, ${count} albums` };
  } catch (err) {
    const code =
      typeof err === "object" && err && "code" in err
        ? String((err as { code: unknown }).code)
        : "";
    const raw = err instanceof Error ? err.message : String(err);
    const lines = raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const hint =
      code === "P2021" || /does not exist/i.test(raw)
        ? 'tables missing — redeploy so the build runs "prisma db push", or run it locally against DATABASE_URL'
        : code === "P1001"
          ? "cannot reach the database — check the Neon branch is active and the URL is correct"
          : 'run "prisma db push" against DATABASE_URL';
    database = {
      ok: false,
      detail: `${code ? `${code}: ` : ""}${lines.slice(0, 3).join(" ")} — ${hint}`,
    };
  }

  const ready = database.ok && Object.values(env).every((c) => c.ok);

  return jsonOk(
    { ready, database, buildSchemaSync: dbSync, env },
    { status: ready ? 200 : 503 }
  );
}
