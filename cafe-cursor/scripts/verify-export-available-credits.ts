/**
 * Unit-ish checks for available-credits CSV builder (no DB).
 * Run: npx tsx scripts/verify-export-available-credits.ts
 */

import { buildAvailableCreditsCsv } from "../lib/export-available-credits";

const csv = buildAvailableCreditsCsv([
  {
    code: "ABC123",
    link: "https://cursor.com/referral?code=ABC123",
    status: "available-unclaimed",
    isTest: false,
    createdAt: "2026-07-19T00:00:00.000Z",
  },
]);

const ok =
  csv.startsWith("link,code,status,isTest,createdAt,note\n") &&
  csv.includes("https://cursor.com/referral?code=ABC123") &&
  csv.includes("available-unclaimed") &&
  csv.includes("export-only snapshot");

if (!ok) {
  console.error("FAIL csv shape:\n", csv);
  process.exit(1);
}

console.log("OK buildAvailableCreditsCsv");
console.log(csv);
