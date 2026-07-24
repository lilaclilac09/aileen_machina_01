/**
 * Export unused / available (unassigned) credits as CSV for a new Google Sheet.
 *
 * IMPORTANT — export only:
 * - Does NOT mark credits used / redeemed
 * - Does NOT delete rows
 * - Credits stay in DB so unclaimed guests can still redeem via the site
 *
 * Do NOT point GOOGLE_SHEET_CREDITS_ID at this export and run Clear+Sync
 * unless you intentionally want to replace the live pool from that sheet.
 */

import { prisma } from "@/lib/prisma";

export type AvailableCreditExportRow = {
  code: string;
  link: string;
  status: "available-unclaimed";
  isTest: boolean;
  createdAt: string;
};

export async function listAvailableCreditsForExport(): Promise<{
  rows: AvailableCreditExportRow[];
  unclaimedApprovedGuests: number;
}> {
  const [credits, unclaimedApprovedGuests] = await Promise.all([
    prisma.credit.findMany({
      where: {
        isUsed: false,
        isTest: false,
        ownerId: null,
      },
      select: {
        code: true,
        link: true,
        isTest: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.eligibleUser.count({
      where: {
        approvalStatus: "approved",
        hasClaimed: false,
      },
    }),
  ]);

  return {
    rows: credits.map((c) => ({
      code: c.code,
      link: c.link,
      status: "available-unclaimed" as const,
      isTest: c.isTest,
      createdAt: c.createdAt.toISOString(),
    })),
    unclaimedApprovedGuests,
  };
}

/** Sheet-friendly CSV: first column is the referral link (same shape as sync import). */
export function buildAvailableCreditsCsv(
  rows: AvailableCreditExportRow[]
): string {
  const header = "link,code,status,isTest,createdAt,note";
  const body = rows
    .map((r) => {
      const note = JSON.stringify(
        "export-only snapshot; still Available in cafe-cursor DB"
      );
      return [
        r.link,
        r.code,
        r.status,
        String(r.isTest),
        r.createdAt,
        note,
      ].join(",");
    })
    .join("\n");
  return `${header}\n${body}\n`;
}
