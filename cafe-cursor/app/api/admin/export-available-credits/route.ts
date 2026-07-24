import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  buildAvailableCreditsCsv,
  listAvailableCreditsForExport,
} from "@/lib/export-available-credits";

/**
 * GET /api/admin/export-available-credits
 *
 * Download unused / available-unclaimed credits as CSV (for a new Google Sheet).
 * Read-only: does not mark used, does not delete, redeem still works for unclaimed guests.
 */
export async function GET() {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rows, unclaimedApprovedGuests } =
      await listAvailableCreditsForExport();

    if (rows.length === 0) {
      return NextResponse.json(
        {
          error: "No available-unclaimed credits to export",
          unclaimedApprovedGuests,
        },
        { status: 404 }
      );
    }

    const csv = buildAvailableCreditsCsv(rows);
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const filename = `available-unclaimed-credits-${stamp}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Export-Count": String(rows.length),
        "X-Unclaimed-Guests": String(unclaimedApprovedGuests),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[ADMIN] Export available credits error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
