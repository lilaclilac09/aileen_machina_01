/**
 * Import Luma guest CSV (no Luma Plus / API required).
 *
 * Export from Luma: Event → Guests → Download CSV
 * Expected columns include: email, name, approval_status, checked_in_at, company survey fields
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { displayNameFromEmail } from "@/lib/validations";

export const LUMA_CSV_COMPANY_TAG = "Luma Guest CSV";

export type LumaCsvImportOptions = {
  /** Only rows with approval_status=approved (default true) */
  onlyApproved?: boolean;
  /** Only rows with checked_in_at set (default false — use true on door day) */
  onlyCheckedIn?: boolean;
};

export type LumaCsvGuest = {
  email: string;
  name: string;
  company: string | null;
  approvalStatus: string;
  checkedIn: boolean;
};

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function normalizeHeader(h: string): string {
  return h.replace(/^\uFEFF/, "").trim().toLowerCase();
}

function pickCompany(row: Record<string, string>): string | null {
  for (const [k, v] of Object.entries(row)) {
    if (/company|公司/i.test(k) && v.trim()) return v.trim().slice(0, 200);
  }
  return null;
}

/**
 * Parse Luma guests CSV text into guest records.
 */
export function parseLumaGuestsCsv(csvText: string): LumaCsvGuest[] {
  const text = csvText.replace(/^\uFEFF/, "").trim();
  if (!text) return [];

  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const emailIdx = headers.findIndex((h) => h === "email");
  if (emailIdx < 0) {
    throw new Error('CSV must include an "email" column (Luma guest export).');
  }

  const nameIdx = headers.findIndex((h) => h === "name");
  const statusIdx = headers.findIndex((h) => h === "approval_status");
  const checkedIdx = headers.findIndex((h) => h === "checked_in_at");

  const guests: LumaCsvGuest[] = [];
  const seen = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (cols[idx] || "").trim();
    });

    const email = (cols[emailIdx] || "").toLowerCase().trim();
    if (!email || !email.includes("@") || seen.has(email)) continue;
    seen.add(email);

    const nameRaw = nameIdx >= 0 ? (cols[nameIdx] || "").trim() : "";
    const approvalStatus =
      statusIdx >= 0
        ? (cols[statusIdx] || "approved").trim().toLowerCase()
        : "approved";
    const checkedIn =
      checkedIdx >= 0 ? Boolean((cols[checkedIdx] || "").trim()) : false;

    guests.push({
      email,
      name: nameRaw || displayNameFromEmail(email),
      company: pickCompany(row),
      approvalStatus,
      checkedIn,
    });
  }

  return guests;
}

export function filterLumaCsvGuests(
  guests: LumaCsvGuest[],
  options: LumaCsvImportOptions = {}
): LumaCsvGuest[] {
  const onlyApproved = options.onlyApproved !== false;
  const onlyCheckedIn = options.onlyCheckedIn === true;

  return guests.filter((g) => {
    if (onlyApproved && g.approvalStatus !== "approved") return false;
    if (onlyCheckedIn && !g.checkedIn) return false;
    return true;
  });
}

/**
 * Upsert filtered Luma CSV guests into EligibleUser.
 */
export async function importLumaGuestsFromCsv(
  csvText: string,
  options: LumaCsvImportOptions = {}
): Promise<{
  parsed: number;
  imported: number;
  created: number;
  updated: number;
  skipped: number;
  checkedInInFile: number;
}> {
  const all = parseLumaGuestsCsv(csvText);
  const filtered = filterLumaCsvGuests(all, options);
  const checkedInInFile = all.filter((g) => g.checkedIn).length;

  const existing = await prisma.eligibleUser.findMany({
    select: { email: true, id: true, hasClaimed: true, name: true, company: true },
  });
  const byEmail = new Map(existing.map((u) => [u.email, u]));

  const toCreate = filtered.filter((g) => !byEmail.has(g.email));
  const toUpdate = filtered.filter((g) => {
    const ex = byEmail.get(g.email);
    return ex && !ex.hasClaimed;
  });
  const skipped = filtered.filter((g) => byEmail.get(g.email)?.hasClaimed).length;

  let created = 0;
  const BATCH = 50;
  for (let i = 0; i < toCreate.length; i += BATCH) {
    const chunk = toCreate.slice(i, i + BATCH);
    const result = await prisma.eligibleUser.createMany({
      data: chunk.map((guest) => ({
        email: guest.email,
        name: guest.name,
        company: guest.company || LUMA_CSV_COMPANY_TAG,
        role: "Attendee",
        approvalStatus: "approved",
        hasClaimed: false,
      })),
    });
    created += result.count;
  }

  let updated = 0;
  for (const guest of toUpdate) {
    await prisma.eligibleUser.update({
      where: { email: guest.email },
      data: {
        name: guest.name,
        company: guest.company || LUMA_CSV_COMPANY_TAG,
        approvalStatus: "approved",
      },
    });
    updated += 1;
  }

  console.log(
    `[LUMA-CSV] import parsed=${all.length} filtered=${filtered.length} created=${created} updated=${updated} skipped=${skipped}`
  );

  return {
    parsed: all.length,
    imported: filtered.length,
    created,
    updated,
    skipped,
    checkedInInFile,
  };
}

const BUNDLED_CSV_CANDIDATES = [
  join(process.cwd(), "data", "luma-guests.csv"),
  join(process.cwd(), "cafe-cursor", "data", "luma-guests.csv"),
];

let bundledImportPromise: Promise<{
  created: number;
  updated: number;
  imported: number;
  skipped: number;
} | null> | null = null;

function findBundledLumaCsv(): string | null {
  for (const p of BUNDLED_CSV_CANDIDATES) {
    if (existsSync(p)) return p;
  }
  return null;
}

/**
 * Auto-import bundled Luma guest CSV when allowlist is behind the file.
 * Re-runs if the CSV grows (e.g. 534 → 537) so new approved emails are upserted.
 */
export async function ensureBundledLumaGuestsImported(): Promise<{
  created: number;
  updated: number;
  imported: number;
  skipped: number;
} | null> {
  if (!bundledImportPromise) {
    bundledImportPromise = (async () => {
      const csvPath = findBundledLumaCsv();
      if (!csvPath) {
        console.warn("[LUMA-CSV] Bundled luma-guests.csv not found");
        return null;
      }

      const csvText = readFileSync(csvPath, "utf-8");
      const approvedInFile = parseLumaGuestsCsv(csvText).filter(
        (g) => g.approvalStatus === "approved"
      ).length;

      const tagged = await prisma.eligibleUser.count({
        where: { company: LUMA_CSV_COMPANY_TAG },
      });
      // Already caught up with this CSV (or a same-sized prior export)
      if (tagged >= approvedInFile && tagged >= 100) return null;

      const total = await prisma.eligibleUser.count();
      if (total >= approvedInFile && tagged === 0 && total >= 400) return null;

      console.log(
        `[LUMA-CSV] Auto-importing bundled guests from ${csvPath} (dbTagged=${tagged} fileApproved=${approvedInFile})`
      );
      const result = await importLumaGuestsFromCsv(csvText, {
        onlyApproved: true,
        onlyCheckedIn: false,
      });
      console.log(
        `[LUMA-CSV] Auto-import done created=${result.created} updated=${result.updated} imported=${result.imported}`
      );
      return {
        created: result.created,
        updated: result.updated,
        imported: result.imported,
        skipped: result.skipped,
      };
    })().catch((err) => {
      console.error("[LUMA-CSV] Auto-import failed:", err);
      bundledImportPromise = null;
      return null;
    });
  }
  return bundledImportPromise;
}
