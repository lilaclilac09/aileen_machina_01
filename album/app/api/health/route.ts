import { prisma } from "@/lib/db";
import { jsonOk } from "@/lib/http";
import { storageDriver } from "@/lib/storage";

export const dynamic = "force-dynamic";

type Check = { ok: boolean; detail: string };

function envCheck(): Record<string, Check> {
  const url = (process.env.DATABASE_URL || "").trim();
  const driver = storageDriver();

  const checks: Record<string, Check> = {
    DATABASE_URL: /^postgres(ql)?:\/\//i.test(url)
      ? { ok: true, detail: "postgres" }
      : /^file:/i.test(url)
        ? { ok: true, detail: "sqlite (local only)" }
        : { ok: false, detail: "missing or not a postgres URI" },
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
    const raw = err instanceof Error ? err.message : String(err);
    const first = raw.split("\n").find((line) => line.trim()) || "unreachable";
    database = {
      ok: false,
      detail: `${first.trim()} — run "prisma db push" against DATABASE_URL`,
    };
  }

  const ready = database.ok && Object.values(env).every((c) => c.ok);

  return jsonOk(
    { ready, database, env },
    { status: ready ? 200 : 503 }
  );
}
