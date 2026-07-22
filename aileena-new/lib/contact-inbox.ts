/**
 * Private contact inbox for lead / auth / chat forwards.
 * Set CONTACT_TO (or LEAD_INBOX) on Vercel — never hardcode a personal address.
 */
export function getContactInbox(): string | null {
  const raw =
    process.env.CONTACT_TO ||
    process.env.LEAD_INBOX ||
    process.env.NOTIFY_CC_EMAIL ||
    "";
  const email = raw.trim().replace(/^["']|["']$/g, "").toLowerCase();
  if (!email.includes("@")) return null;
  // Reject accidental personal-inbox hardcoding patterns in misconfigured deploys
  return email;
}
