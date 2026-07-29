/**
 * Offline checks: guest-facing addresses never include personal inboxes.
 * Run: npx tsx scripts/verify-organizer-privacy.ts
 */
import {
  assertGuestFacingAddresses,
  getPublicReplyToAddress,
  isPersonalInbox,
  maskContact,
} from "../lib/organizer-privacy";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(isPersonalInbox("aileen@gmail.com"), "gmail personal");
assert(isPersonalInbox("x@qq.com"), "qq personal");
assert(isPersonalInbox("x@outlook.com"), "outlook personal");
assert(!isPersonalInbox("cafe@aileena.xyz"), "brand ok");
assert(!isPersonalInbox("noreply@cursor.com"), "cursor ok");

assert(
  assertGuestFacingAddresses({
    from: "Cafe Cursor <cafe@aileena.xyz>",
    replyTo: "cafe@aileena.xyz",
  }) === null,
  "brand headers ok"
);

assert(
  Boolean(
    assertGuestFacingAddresses({
      from: "me@gmail.com",
      replyTo: "cafe@aileena.xyz",
    })
  ),
  "reject personal From"
);

assert(
  Boolean(
    assertGuestFacingAddresses({
      from: "Cafe Cursor <cafe@aileena.xyz>",
      replyTo: "me@gmail.com",
    })
  ),
  "reject personal Reply-To"
);

const reply = getPublicReplyToAddress();
assert(!isPersonalInbox(reply), `public reply-to must not be personal: ${reply}`);
assert(maskContact("hello@gmail.com") === "h***@gmail.com", "mask");

process.env.FROM_EMAIL = "Aileen <me@gmail.com>";
// Re-import after env mutation — email module reads env at call time
void import("../lib/email").then(({ getFromEmail }) => {
  const forced = getFromEmail();
  assert(!/@gmail\.com/i.test(forced), `from sanitized: ${forced}`);
  assert(/cafe@aileena\.xyz/i.test(forced), "forced brand from");
  console.log("verify-organizer-privacy: ok");
});
