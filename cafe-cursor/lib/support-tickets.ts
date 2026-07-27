import { prisma } from "@/lib/prisma";
import { sendSupportTicketAlert } from "@/lib/email";
import type { SupportCategory } from "@/lib/support-ticket-types";

export {
  SUPPORT_CATEGORIES,
  createTicketSchema,
  type SupportCategory,
  type CreateTicketInput,
} from "@/lib/support-ticket-types";

const RATE_LIMIT_PER_HOUR = 5;

export async function createSupportTicket(input: {
  email: string;
  lumaEmail?: string | null;
  category: SupportCategory;
  message: string;
  locale?: string | null;
  userAgent?: string | null;
}): Promise<
  | { ok: true; id: string; notified: boolean }
  | { ok: false; error: string; status: number }
> {
  const email = input.email.toLowerCase().trim();
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await prisma.supportTicket.count({
    where: { email, createdAt: { gte: since } },
  });
  if (recent >= RATE_LIMIT_PER_HOUR) {
    return {
      ok: false,
      error: "Too many tickets from this email. Please wait and try again.",
      status: 429,
    };
  }

  const luma =
    input.lumaEmail && input.lumaEmail.trim()
      ? input.lumaEmail.toLowerCase().trim()
      : null;

  const ticket = await prisma.supportTicket.create({
    data: {
      email,
      lumaEmail: luma,
      category: input.category,
      message: input.message.trim(),
      locale: input.locale || null,
      userAgent: input.userAgent?.slice(0, 400) || null,
      status: "open",
    },
  });

  let notified = false;
  try {
    const result = await sendSupportTicketAlert({
      ticketId: ticket.id,
      email: ticket.email,
      lumaEmail: ticket.lumaEmail,
      category: ticket.category,
      message: ticket.message,
      createdAt: ticket.createdAt.toISOString(),
    });
    notified = result.sent;
  } catch (err) {
    console.error("[TICKET] Organizer notify failed:", err);
  }

  return { ok: true, id: ticket.id, notified };
}
