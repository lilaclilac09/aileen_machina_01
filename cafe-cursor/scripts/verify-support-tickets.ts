/**
 * Offline checks for support ticket validation (no DB).
 * Run: npx tsx scripts/verify-support-tickets.ts
 */
import {
  createTicketSchema,
  CURSOR_SPENDING_URL,
} from "../lib/support-ticket-types";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const tinyPng =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const ok = createTicketSchema.safeParse({
  email: "guest@example.com",
  category: "credits_not_landed",
  message: "Tapped Use credits but Spending still empty",
  locale: "zh",
  screenshotDataUrl: tinyPng,
});
assert(ok.success, "valid ticket with screenshot");

const noShot = createTicketSchema.safeParse({
  email: "guest@example.com",
  category: "other",
  message: "long enough message here",
});
assert(!noShot.success, "reject missing screenshot");

const short = createTicketSchema.safeParse({
  email: "guest@example.com",
  category: "other",
  message: "too short",
  screenshotDataUrl: tinyPng,
});
assert(!short.success, "reject short message");

const badCat = createTicketSchema.safeParse({
  email: "guest@example.com",
  category: "hack",
  message: "long enough message here",
  screenshotDataUrl: tinyPng,
});
assert(!badCat.success, "reject bad category");

assert(
  CURSOR_SPENDING_URL === "https://cursor.com/dashboard/spending",
  "spending url"
);

console.log("verify-support-tickets: ok");
