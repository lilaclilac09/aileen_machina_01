import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { getReminderSubject, getNotifyCcEmail } from "@/lib/email";

function looksLikeRealResendKey(key: string): boolean {
  const value = key.trim().replace(/^["']|["']$/g, "");
  if (!value.startsWith("re_")) return false;
  if (/placeholder|your_api|xxx|changeme/i.test(value)) return false;
  return value.length >= 20;
}

function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key || !looksLikeRealResendKey(key)) return null;
  return new Resend(key);
}

/** Resend last_event values that mean the message reached (or was opened by) the inbox. */
const DELIVERED_EVENTS = new Set([
  "delivered",
  "opened",
  "clicked",
]);

function collectRecipients(item: {
  to?: string[] | null;
  bcc?: string[] | null;
  cc?: string[] | null;
}): string[] {
  const out: string[] = [];
  const organizer = getNotifyCcEmail();
  for (const list of [item.to, item.bcc, item.cc]) {
    for (const raw of list || []) {
      const email = String(raw).trim().toLowerCase();
      if (!email.includes("@")) continue;
      // Skip organizer — they get [COPY]/[TEST] or sit in to/bcc of blast rows
      if (email === organizer) continue;
      out.push(email);
    }
  }
  return out;
}

/**
 * Pull Resend sent-email log for subject "Cafe Cursor Shanghai 20260719"
 * and write reminderSentAt for matching EligibleUser emails.
 *
 * Uses RESEND_API_KEY. Exact subject match (skips [TEST] / [COPY]).
 * Collects to + bcc + cc so historical BCC blasts are covered.
 */
export async function syncReminderSentAtFromResend(options?: {
  maxPages?: number;
}): Promise<{
  success: boolean;
  error?: string;
  scanned: number;
  matchedSubject: number;
  deliveredRecipients: number;
  marked: number;
  alreadyMarked: number;
  notInList: number;
  sample: string[];
  subject: string;
}> {
  const subject = getReminderSubject();
  const resend = getResendClient();
  if (!resend) {
    return {
      success: false,
      error: "RESEND_API_KEY not set on this deployment",
      scanned: 0,
      matchedSubject: 0,
      deliveredRecipients: 0,
      marked: 0,
      alreadyMarked: 0,
      notInList: 0,
      sample: [],
      subject,
    };
  }

  const maxPages = options?.maxPages ?? 30;
  let scanned = 0;
  let matchedSubject = 0;
  let after: string | undefined;
  const deliveredByEmail = new Map<string, Date>();

  for (let page = 0; page < maxPages; page++) {
    const listOpts: { limit: number; after?: string } = { limit: 100 };
    if (after) listOpts.after = after;

    const { data, error } = await resend.emails.list(listOpts);
    if (error) {
      return {
        success: false,
        error: error.message,
        scanned,
        matchedSubject,
        deliveredRecipients: deliveredByEmail.size,
        marked: 0,
        alreadyMarked: 0,
        notInList: 0,
        sample: [],
        subject,
      };
    }
    if (!data?.data?.length) break;

    for (const item of data.data) {
      scanned += 1;
      const itemSubject = (item.subject || "").trim();
      // Exact reminder subject — skip [TEST] / [COPY]
      if (itemSubject !== subject) continue;
      matchedSubject += 1;

      if (!DELIVERED_EVENTS.has(item.last_event)) continue;

      const created = item.created_at ? new Date(item.created_at) : new Date();
      for (const email of collectRecipients(item)) {
        const prev = deliveredByEmail.get(email);
        if (!prev || created > prev) deliveredByEmail.set(email, created);
      }
    }

    if (!data.has_more) break;
    after = data.data[data.data.length - 1]?.id;
    if (!after) break;
  }

  const emails = [...deliveredByEmail.keys()];
  if (emails.length === 0) {
    return {
      success: true,
      scanned,
      matchedSubject,
      deliveredRecipients: 0,
      marked: 0,
      alreadyMarked: 0,
      notInList: 0,
      sample: [],
      subject,
    };
  }

  const existing = await prisma.eligibleUser.findMany({
    where: { email: { in: emails } },
    select: { id: true, email: true, reminderSentAt: true },
  });
  const existingMap = new Map(
    existing.map((u) => [u.email.toLowerCase(), u])
  );

  let marked = 0;
  let alreadyMarked = 0;
  let notInList = 0;

  for (const email of emails) {
    const at = deliveredByEmail.get(email)!;
    const row = existingMap.get(email);
    if (!row) {
      notInList += 1;
      continue;
    }
    if (row.reminderSentAt && row.reminderSentAt >= at) {
      alreadyMarked += 1;
      continue;
    }
    await prisma.eligibleUser.update({
      where: { id: row.id },
      data: { reminderSentAt: at },
    });
    marked += 1;
  }

  console.log(
    `[RESEND-SYNC] subject="${subject}" scanned=${scanned} matched=${matchedSubject} delivered=${emails.length} marked=${marked} already=${alreadyMarked} notInList=${notInList}`
  );

  return {
    success: true,
    scanned,
    matchedSubject,
    deliveredRecipients: emails.length,
    marked,
    alreadyMarked,
    notInList,
    sample: emails.slice(0, 15),
    subject,
  };
}
