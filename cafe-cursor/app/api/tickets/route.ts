import { NextRequest, NextResponse } from "next/server";
import {
  createSupportTicket,
  createTicketSchema,
} from "@/lib/support-tickets";

/**
 * POST /api/tickets — public guest support ticket (no cafe@ inbound needed).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createTicketSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }

    const data = parsed.data;
    const result = await createSupportTicket({
      email: data.email,
      lumaEmail: data.lumaEmail || null,
      category: data.category,
      message: data.message,
      locale: data.locale || null,
      userAgent: request.headers.get("user-agent"),
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      id: result.id,
      notified: result.notified,
    });
  } catch (err) {
    console.error("[TICKET] POST error:", err);
    return NextResponse.json(
      { success: false, error: "Could not submit ticket. Please try again." },
      { status: 500 }
    );
  }
}
