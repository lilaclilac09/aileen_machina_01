/**
 * Offline checks for support ticket validation (no DB).
 * Run: npx tsx scripts/verify-support-tickets.ts
 */
import { createTicketSchema } from "../lib/support-ticket-types";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const ok = createTicketSchema.safeParse({
  email: "guest@example.com",
  category: "credits_not_landed",
  message: "Tapped Use credits but Balance still 0",
  locale: "zh",
});
assert(ok.success, "valid ticket");

const short = createTicketSchema.safeParse({
  email: "guest@example.com",
  category: "other",
  message: "too short",
});
assert(!short.success, "reject short message");

const badCat = createTicketSchema.safeParse({
  email: "guest@example.com",
  category: "hack",
  message: "long enough message here",
});
assert(!badCat.success, "reject bad category");

console.log("verify-support-tickets: ok");
