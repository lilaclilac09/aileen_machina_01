import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getEventCheckinCode } from "@/lib/event-config";

/**
 * GET /api/host
 * Admin-only: returns the shareable redeem URL + QR payload for IRL distribution.
 */
export async function GET(request: Request) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const checkinCode = getEventCheckinCode();
  if (!checkinCode) {
    return NextResponse.json(
      {
        error:
          "EVENT_CHECKIN_CODE is not set. Add it to .env so the QR can embed the door code.",
      },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const originParam = searchParams.get("origin");
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "";
  const origin = (originParam || configured || "").replace(/\/$/, "");

  if (!origin) {
    return NextResponse.json(
      {
        error: "Missing site origin. Open /host from the deployed site, or set NEXT_PUBLIC_SITE_URL.",
      },
      { status: 400 }
    );
  }

  const redeemUrl = `${origin}/?code=${encodeURIComponent(checkinCode)}&lang=en`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=12&data=${encodeURIComponent(redeemUrl)}`;

  return NextResponse.json({
    success: true,
    checkinCode,
    redeemUrl,
    qrImageUrl,
    tips: [
      "Print this QR or show it on a tablet at the door after check-in.",
      "Scanning opens the redeem page with the door code already filled.",
      "Attendees only need to enter name + email.",
    ],
  });
}
