/**
 * Offline checks for support ticket validation (no DB).
 * Run: npx tsx scripts/verify-support-tickets.ts
 */
import {
  createTicketSchema,
  CURSOR_SPENDING_URL,
  requiresDualScreenshots,
} from "../lib/support-ticket-types";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const tinyPng =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

assert(
  !requiresDualScreenshots({
    category: "credits_not_landed",
    email: "a@x.com",
  }),
  "single account no dual"
);
assert(
  requiresDualScreenshots({
    category: "email_mismatch",
    email: "a@x.com",
  }),
  "mismatch needs dual"
);
assert(
  requiresDualScreenshots({
    category: "other",
    email: "a@x.com",
    lumaEmail: "b@x.com",
  }),
  "different luma needs dual"
);

const ok = createTicketSchema.safeParse({
  email: "guest@example.com",
  category: "credits_not_landed",
  message: "Tapped Use credits but Spending still empty",
  locale: "zh",
  screenshotDataUrl: tinyPng,
});
assert(ok.success, "valid single-shot ticket");

const swapMissing = createTicketSchema.safeParse({
  email: "a@example.com",
  lumaEmail: "b@example.com",
  category: "email_mismatch",
  message: "Want to redeem on other account please help",
  screenshotDataUrl: tinyPng,
});
assert(!swapMissing.success, "reject swap without shot 2");

const swapOk = createTicketSchema.safeParse({
  email: "a@example.com",
  lumaEmail: "b@example.com",
  category: "email_mismatch",
  message: "Want to redeem on other account please help",
  screenshotDataUrl: tinyPng,
  screenshot2DataUrl: tinyPng,
});
assert(swapOk.success, "valid dual-shot swap ticket");

const noShot = createTicketSchema.safeParse({
  email: "guest@example.com",
  category: "other",
  message: "long enough message here",
});
assert(!noShot.success, "reject missing screenshot");

assert(
  CURSOR_SPENDING_URL === "https://cursor.com/dashboard/spending",
  "spending url"
);

console.log("verify-support-tickets: ok");
