import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema, displayNameFromEmail } from "@/lib/validations";
import { ZodError } from "zod";
import {
  getRedeemMode,
  getEventCheckinCode,
  isCheckinCodeValid,
  requiresCheckinCode,
  isLumaRedeemMode,
} from "@/lib/event-config";
import { ensureCreditsSynced } from "@/lib/google-sheets";
import { ensureLumaCheckedInUser, isLumaConfigured } from "@/lib/luma";
import { getVolunteerMaxClaims } from "@/lib/claims";

/** Mask email in logs — never print full addresses to shared log sinks. */
function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return "***";
  const head = user.slice(0, 1) || "*";
  return `${head}***@${domain}`;
}

/** Generic denial — do not reveal allowlist / approval / claim status. */
function denyClaim(message?: string) {
  return NextResponse.json(
    {
      success: false,
      error:
        message ||
        "Unable to redeem with this email. Please ask staff for help.",
      code: "CLAIM_DENIED",
    },
    { status: 403 }
  );
}

/**
 * POST /api/register
 * IRL redeem after check-in.
 *
 * Privacy rules (non-admin):
 * - First successful claim for this request may return THAT credit link only.
 * - Already-claimed emails never re-expose the credit link (ask staff / admin).
 * - Errors do not reveal allowlist membership, approval, or inventory size.
 * - Guest CSV / sheet sync side-effects are not triggered here for allowlist
 *   (admin imports only). Credits pool may still refill server-side if empty.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);
    const { email, checkinCode } = validatedData;
    const normalizedEmail = email.toLowerCase().trim();
    const name =
      validatedData.name?.trim() || displayNameFromEmail(normalizedEmail);
    const redeemMode = getRedeemMode();
    const lumaMode = isLumaRedeemMode();

    console.log(`📝 [REGISTER] Attempt: ${maskEmail(normalizedEmail)} mode=${redeemMode}`);

    if (redeemMode === "luma" && !isLumaConfigured()) {
      // Opaque — do not name missing env vars publicly
      return denyClaim();
    }

    if (getEventCheckinCode() && !isCheckinCodeValid(checkinCode)) {
      console.log(`❌ [REGISTER] Bad check-in code: ${maskEmail(normalizedEmail)}`);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid check-in code. Please check in at the door first.",
          code: "BAD_CHECKIN_CODE",
        },
        { status: 403 }
      );
    }

    // Refill credit pool if empty (server-side only; links never listed publicly)
    await ensureCreditsSynced();

    if (lumaMode) {
      const luma = await ensureLumaCheckedInUser(normalizedEmail);
      if (!luma.ok) {
        console.log(`❌ [REGISTER] Not on Luma list: ${maskEmail(normalizedEmail)}`);
        return denyClaim();
      }
    }

    let eligibleUser = await prisma.eligibleUser.findUnique({
      where: { email: normalizedEmail },
      include: { credit: true, ownedCredits: true },
    });

    if (!eligibleUser && redeemMode === "open") {
      eligibleUser = await prisma.eligibleUser.create({
        data: {
          email: normalizedEmail,
          name,
          company: "IRL Check-in",
          role: "Attendee",
          approvalStatus: "approved",
          hasClaimed: false,
        },
        include: { credit: true, ownedCredits: true },
      });
      console.log(`➕ [REGISTER] Walk-up: ${maskEmail(normalizedEmail)}`);
    }

    if (!eligibleUser || eligibleUser.approvalStatus !== "approved") {
      console.log(`❌ [REGISTER] Denied: ${maskEmail(normalizedEmail)}`);
      return denyClaim();
    }

    const ownedCount = eligibleUser.ownedCredits?.length
      ? eligibleUser.ownedCredits.length
      : eligibleUser.hasClaimed && eligibleUser.creditId
        ? 1
        : 0;
    const maxClaims = eligibleUser.isVolunteer ? getVolunteerMaxClaims() : 1;
    const canClaimMore = ownedCount < maxClaims;

    // Already claimed — NEVER re-expose credit link to anonymous clients
    if (eligibleUser.hasClaimed && eligibleUser.credit && !canClaimMore) {
      console.log(
        `⚠️ [REGISTER] Already claimed (no re-show): ${maskEmail(normalizedEmail)}`
      );
      return NextResponse.json(
        {
          success: true,
          alreadyClaimed: true,
          message:
            "This email already claimed a credit. Ask staff if you need the link again.",
          // Intentionally omit: credit, user PII beyond confirmation, caps
        },
        { status: 200 }
      );
    }

    const isTestUser = eligibleUser.company === "Test Company";

    const availableCredit = await prisma.credit.findFirst({
      where: {
        isUsed: false,
        isTest: isTestUser,
      },
      orderBy: { createdAt: "asc" },
    });

    if (!availableCredit) {
      console.log(`❌ [REGISTER] No credits (isTest: ${isTestUser})`);
      return NextResponse.json(
        {
          success: false,
          error:
            "Sorry, no credits are available right now. Please contact the organizer.",
          code: "NO_CREDITS",
        },
        { status: 503 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.eligibleUser.update({
        where: { id: eligibleUser!.id },
        data: {
          name: name || eligibleUser!.name,
          hasClaimed: true,
          claimedAt: new Date(),
          creditId: availableCredit.id,
        },
      });

      await tx.credit.update({
        where: { id: availableCredit.id },
        data: {
          isUsed: true,
          assignedAt: new Date(),
          ownerId: eligibleUser!.id,
        },
      });

      return updatedUser;
    });

    const newClaimCount = ownedCount + 1;
    console.log(
      `✅ [REGISTER] Assigned: ${maskEmail(normalizedEmail)} (#${newClaimCount})`
    );

    // First-time claim for this request: show ONLY this guest's new link.
    // Do not expose volunteer flags, caps, company, or other guests.
    return NextResponse.json(
      {
        success: true,
        message: "Congratulations! Here is your Cursor credit:",
        credit: availableCredit.link,
        user: {
          email: result.email,
        },
        emailSent: false,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      console.log(`⚠️ [REGISTER] Validation:`, error.errors);
      return NextResponse.json(
        {
          success: false,
          error: error.errors[0]?.message || "Invalid data",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    console.error(`❌ [REGISTER] Internal error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error. Please try again.",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/register
 * Minimal public config only — no counts, emails, inventory, or mode internals.
 */
export async function GET() {
  try {
    return NextResponse.json({
      requiresCheckinCode: requiresCheckinCode(),
    });
  } catch (error) {
    console.error(`❌ [STATS] Error:`, error);
    return NextResponse.json(
      { requiresCheckinCode: false },
      { status: 500 }
    );
  }
}
