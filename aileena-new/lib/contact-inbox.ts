/**
 * Private contact inbox for lead / auth / chat forwards.
 * Prefer CONTACT_TO / LEAD_INBOX on Vercel (forward to your personal inbox there).
 * Brand fallback keeps agent lead-capture working without personal Gmail in source.
 */
export function getContactInbox(): string | null {
  const raw =
    process.env.CONTACT_TO ||
    process.env.LEAD_INBOX ||
    process.env.NOTIFY_CC_EMAIL ||
    "cafe@aileena.xyz";
  const email = raw.trim().replace(/^["']|["']$/g, "").toLowerCase();
  if (!email.includes("@")) return null;
  return email;
}
