/**
 * Fetch Cursor credit referral links from a published Google Sheet CSV.
 *
 * Expected sheet format (Cafe Cursor Shanghai):
 * - One column of referral URLs (no header required)
 * - Example: https://cursor.com/referral?code=ABC123
 */

import { prisma } from "@/lib/prisma";

export function getCreditsSheetCsvUrl(): string {
  if (process.env.GOOGLE_SHEET_CREDITS_CSV_URL) {
    return process.env.GOOGLE_SHEET_CREDITS_CSV_URL;
  }
  const sheetId = process.env.GOOGLE_SHEET_CREDITS_ID;
  if (!sheetId) {
    throw new Error(
      "GOOGLE_SHEET_CREDITS_ID (or GOOGLE_SHEET_CREDITS_CSV_URL) is not set"
    );
  }
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
}

export function extractReferralCode(link: string): string {
  const match = link.match(/code=([A-Za-z0-9]+)/i);
  if (match) return match[1];
  return link.replace(/[^A-Za-z0-9]/g, "").substring(0, 12);
}

export function normalizeCreditLink(raw: string): string | null {
  const value = raw.trim().replace(/^"|"$/g, "");
  if (!value) return null;

  // Full Cursor referral URL
  if (/cursor\.com\/referral/i.test(value)) {
    const code = extractReferralCode(value);
    return code ? `https://cursor.com/referral?code=${code}` : null;
  }

  // Bare code
  if (/^[A-Za-z0-9]{4,32}$/.test(value)) {
    return `https://cursor.com/referral?code=${value}`;
  }

  // Row that looks like a CSV header
  if (/^(link|url|code|referral)$/i.test(value)) {
    return null;
  }

  return null;
}

export async function fetchCreditLinksFromSheet(
  csvUrl: string = getCreditsSheetCsvUrl()
): Promise<{ links: string[]; source: string }> {
  const response = await fetch(csvUrl, {
    cache: "no-store",
    redirect: "follow",
    headers: {
      Accept: "text/csv,text/plain,*/*",
      "User-Agent": "cafe-cursor-sync/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Google Sheet CSV (${response.status})`);
  }

  const text = await response.text();
  if (text.includes("<HTML>") || text.includes("<!DOCTYPE")) {
    throw new Error(
      "Google Sheet returned HTML instead of CSV. Make sure the sheet is shared as Anyone with the link can view."
    );
  }

  const links: string[] = [];
  const seen = new Set<string>();

  for (const line of text.split(/\r?\n/)) {
    const firstCell = line.split(",")[0] ?? "";
    const link = normalizeCreditLink(firstCell);
    if (!link) continue;
    const code = extractReferralCode(link);
    if (seen.has(code)) continue;
    seen.add(code);
    links.push(link);
  }

  return { links, source: csvUrl };
}

/**
 * Credit sync rule (same as guest list):
 * 1) MUST clear unused credits first (the pool cache)
 * 2) THEN import links from the Google Sheet
 * Used / assigned credits are never deleted.
 */
export async function clearUnusedCredits(): Promise<{
  deleted: number;
  keptUsed: number;
}> {
  const keptUsed = await prisma.credit.count({ where: { isUsed: true } });
  // Only delete unused credits that are not linked to a user
  const result = await prisma.credit.deleteMany({
    where: {
      isUsed: false,
      ownerId: null,
    },
  });
  console.log(
    `[SHEET] Cleared unused credit cache: deleted=${result.count} keptUsed=${keptUsed}`
  );
  return { deleted: result.count, keptUsed };
}

/**
 * Upsert unused credits from the Google Sheet into the database.
 * Pass clearFirst=true (admin Sync) to wipe unused pool before import.
 */
export async function syncCreditsFromSheet(
  csvUrl?: string,
  options: { clearFirst?: boolean } = {}
): Promise<{
  created: number;
  skipped: number;
  cleared: number;
  totalInSheet: number;
  available: number;
  source: string;
  keptUsed: number;
}> {
  let cleared = 0;
  let keptUsed = await prisma.credit.count({ where: { isUsed: true } });

  if (options.clearFirst) {
    const wipe = await clearUnusedCredits();
    cleared = wipe.deleted;
    keptUsed = wipe.keptUsed;
  }

  const { links, source } = await fetchCreditLinksFromSheet(
    csvUrl || getCreditsSheetCsvUrl()
  );

  let created = 0;
  let skipped = 0;

  for (const link of links) {
    const code = extractReferralCode(link);
    const existing = await prisma.credit.findFirst({
      where: { OR: [{ code }, { link }] },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.credit.create({
      data: {
        code,
        link,
        isUsed: false,
        isTest: false,
      },
    });
    created++;
  }

  const available = await prisma.credit.count({
    where: { isUsed: false, isTest: false },
  });

  return {
    created,
    skipped,
    cleared,
    totalInSheet: links.length,
    available,
    source,
    keptUsed,
  };
}

/**
 * If the real credit pool is empty, pull once from the Google Sheet.
 * Failures are logged; callers should treat empty pool as NO_CREDITS.
 */
export async function ensureCreditsSynced(): Promise<number> {
  const available = await prisma.credit.count({
    where: { isUsed: false, isTest: false },
  });
  if (available > 0) return available;

  try {
    console.log("📥 [SHEET] No credits in DB — auto-syncing from Google Sheet...");
    const result = await syncCreditsFromSheet();
    console.log(
      `📥 [SHEET] Auto-sync done: created=${result.created} available=${result.available}`
    );
    return result.available;
  } catch (err) {
    console.error("📥 [SHEET] Auto-sync skipped/failed:", err);
    return 0;
  }
}
