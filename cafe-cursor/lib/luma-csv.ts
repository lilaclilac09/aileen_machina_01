/**
 * Import Luma guest CSV (no Luma Plus / API required).
 *
 * Export from Luma: Event → Guests → Download CSV
 * Expected columns include: email, name, approval_status, checked_in_at, company survey fields
 */

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

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const guest of filtered) {
    const existing = await prisma.eligibleUser.findUnique({
      where: { email: guest.email },
    });

    if (!existing) {
      await prisma.eligibleUser.create({
        data: {
          email: guest.email,
          name: guest.name,
          company: guest.company || LUMA_CSV_COMPANY_TAG,
          role: "Attendee",
          approvalStatus: "approved",
          hasClaimed: false,
        },
      });
      created += 1;
      continue;
    }

    if (existing.hasClaimed) {
      skipped += 1;
      continue;
    }

    await prisma.eligibleUser.update({
      where: { id: existing.id },
      data: {
        name: guest.name || existing.name,
        company: guest.company || existing.company || LUMA_CSV_COMPANY_TAG,
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
