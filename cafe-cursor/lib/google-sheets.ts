/**
 * Fetch Cursor credit referral links from a published Google Sheet CSV.
 *
 * Expected sheet format (Cafe Cursor Shanghai):
 * - One column of referral URLs (no header required)
 * - Example: https://cursor.com/referral?code=ABC123
 */

const DEFAULT_SHEET_ID = "1STC2voXO53oWsfMqH3mdQMdf6xeTDw7gEQA0DGRZOik";

export function getCreditsSheetCsvUrl(): string {
  if (process.env.GOOGLE_SHEET_CREDITS_CSV_URL) {
    return process.env.GOOGLE_SHEET_CREDITS_CSV_URL;
  }
  const sheetId = process.env.GOOGLE_SHEET_CREDITS_ID || DEFAULT_SHEET_ID;
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
    headers: { Accept: "text/csv,text/plain,*/*" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Google Sheet CSV (${response.status})`);
  }

  const text = await response.text();
  const links: string[] = [];
  const seen = new Set<string>();

  for (const line of text.split(/\r?\n/)) {
    // Take first cell if CSV has multiple columns
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
