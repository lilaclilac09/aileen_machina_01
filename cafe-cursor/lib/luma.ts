/**
 * Luma Calendar API — sync checked-in guests for IRL redeem.
 *
 * Docs: https://docs.luma.com/reference/getting-started-with-your-api
 * Auth: x-luma-api-key (Luma Plus, calendar-scoped key)
 * Guests: GET /v1/events/guests/list — checked-in if any event_tickets[].checked_in_at
 */

import { prisma } from "@/lib/prisma";
import { displayNameFromEmail } from "@/lib/validations";

const LUMA_API_BASE = "https://public-api.luma.com";
export const LUMA_COMPANY_TAG = "Luma Check-in";

export function isLumaConfigured(): boolean {
  return Boolean(getLumaApiKey() && getLumaEventId());
}

export function getLumaApiKey(): string | null {
  const key = (process.env.LUMA_API_KEY || "").trim();
  return key || null;
}

export function getLumaEventId(): string | null {
  const id = (process.env.LUMA_EVENT_ID || "").trim();
  return id || null;
}

type LumaTicket = {
  checked_in_at?: string | null;
};

type LumaGuestEntry = {
  id?: string;
  user_email?: string | null;
  user_name?: string | null;
  approval_status?: string | null;
  event_tickets?: LumaTicket[] | null;
  // deprecated compatibility fields
  email?: string | null;
  name?: string | null;
  checked_in_at?: string | null;
};

function guestEmail(entry: LumaGuestEntry): string | null {
  const raw = entry.user_email || entry.email;
  if (!raw || typeof raw !== "string") return null;
  const email = raw.toLowerCase().trim();
  return email.includes("@") ? email : null;
}

function guestName(entry: LumaGuestEntry, email: string): string {
  const name = (entry.user_name || entry.name || "").trim();
  return name || displayNameFromEmail(email);
}

export function isGuestCheckedIn(entry: LumaGuestEntry): boolean {
  const tickets = entry.event_tickets;
  if (Array.isArray(tickets) && tickets.some((t) => Boolean(t?.checked_in_at))) {
    return true;
  }
  // legacy top-level field (older API responses)
  return Boolean(entry.checked_in_at);
}

async function lumaFetch(path: string, searchParams: Record<string, string>) {
  const apiKey = getLumaApiKey();
  if (!apiKey) {
    throw new Error("LUMA_API_KEY is not set");
  }

  const url = new URL(path, LUMA_API_BASE);
  for (const [k, v] of Object.entries(searchParams)) {
    if (v) url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: {
      "x-luma-api-key": apiKey,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Luma API ${res.status}: ${body.slice(0, 200) || res.statusText}`
    );
  }

  return res.json();
}

/**
 * Paginate all guests for the configured event (approved by default).
 */
export async function listLumaGuests(options?: {
  approvalStatus?: string;
}): Promise<LumaGuestEntry[]> {
  const eventId = getLumaEventId();
  if (!eventId) {
    throw new Error("LUMA_EVENT_ID is not set");
  }

  const entries: LumaGuestEntry[] = [];
  let cursor: string | undefined;
  let pages = 0;
  const maxPages = 50;

  do {
    const params: Record<string, string> = {
      event_id: eventId,
      pagination_limit: "100",
      sort_column: "checked_in_at",
      sort_direction: "desc nulls last",
    };
    if (options?.approvalStatus) {
      params.approval_status = options.approvalStatus;
    }
    if (cursor) params.pagination_cursor = cursor;

    const json = await lumaFetch("/v1/events/guests/list", params);
    const page = Array.isArray(json?.entries) ? json.entries : [];
    entries.push(...page);

    cursor = json?.has_more && json?.next_cursor ? String(json.next_cursor) : undefined;
    pages += 1;
  } while (cursor && pages < maxPages);

  return entries;
}

export async function listCheckedInGuests(): Promise<
  { email: string; name: string }[]
> {
  // Prefer approved guests; still filter by ticket checked_in_at
  const guests = await listLumaGuests({ approvalStatus: "approved" });
  const out: { email: string; name: string }[] = [];
  const seen = new Set<string>();

  for (const g of guests) {
    if (!isGuestCheckedIn(g)) continue;
    const email = guestEmail(g);
    if (!email || seen.has(email)) continue;
    seen.add(email);
    out.push({ email, name: guestName(g, email) });
  }

  return out;
}

/**
 * Upsert Luma checked-in guests into EligibleUser (does not revoke claims).
 */
export async function syncCheckedInFromLuma(): Promise<{
  fetched: number;
  checkedIn: number;
  created: number;
  updated: number;
  skipped: number;
}> {
  if (!isLumaConfigured()) {
    throw new Error(
      "Luma is not configured. Set LUMA_API_KEY and LUMA_EVENT_ID (Luma Plus calendar API key)."
    );
  }

  const checkedIn = await listCheckedInGuests();
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const guest of checkedIn) {
    const existing = await prisma.eligibleUser.findUnique({
      where: { email: guest.email },
    });

    if (!existing) {
      await prisma.eligibleUser.create({
        data: {
          email: guest.email,
          name: guest.name,
          company: LUMA_COMPANY_TAG,
          role: "Attendee",
          approvalStatus: "approved",
          hasClaimed: false,
        },
      });
      created += 1;
      continue;
    }

    // Keep claim state; refresh name/company if still unused
    if (!existing.hasClaimed) {
      await prisma.eligibleUser.update({
        where: { id: existing.id },
        data: {
          name: guest.name || existing.name,
          company: existing.company || LUMA_COMPANY_TAG,
          approvalStatus: "approved",
        },
      });
      updated += 1;
    } else {
      skipped += 1;
    }
  }

  console.log(
    `[LUMA] Sync: checkedIn=${checkedIn.length} created=${created} updated=${updated} skipped=${skipped}`
  );

  return {
    fetched: checkedIn.length,
    checkedIn: checkedIn.length,
    created,
    updated,
    skipped,
  };
}

/**
 * Ensure this email is a Luma checked-in guest in our DB.
 * Syncs from Luma when missing (day-of friendly).
 */
export async function ensureLumaCheckedInUser(email: string): Promise<{
  ok: boolean;
  reason?: string;
}> {
  const normalized = email.toLowerCase().trim();
  if (!isLumaConfigured()) {
    return { ok: false, reason: "Luma is not configured" };
  }

  const existing = await prisma.eligibleUser.findUnique({
    where: { email: normalized },
  });
  if (existing && existing.approvalStatus === "approved") {
    return { ok: true };
  }

  // Refresh from Luma, then re-check
  await syncCheckedInFromLuma();

  const after = await prisma.eligibleUser.findUnique({
    where: { email: normalized },
  });
  if (after && after.approvalStatus === "approved") {
    return { ok: true };
  }

  return {
    ok: false,
    reason: "Email is not checked in on Luma for this event",
  };
}
