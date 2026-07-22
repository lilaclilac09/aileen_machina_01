import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema, displayNameFromEmail } from "@/lib/validations";
import { ZodError } from "zod";
import { sendCreditEmail } from "@/lib/email";
import {
  getRedeemMode,
  getEventCheckinCode,
  isCheckinCodeValid,
  requiresCheckinCode,
  isLumaRedeemMode,
} from "@/lib/event-config";
import { ensureCreditsSynced } from "@/lib/google-sheets";
import { ensureLumaCheckedInUser, isLumaConfigured } from "@/lib/luma";
import { ensureBundledLumaGuestsImported } from "@/lib/luma-csv";
import { getVolunteerMaxClaims } from "@/lib/claims";

/**
 * POST /api/register
 * IRL redeem: after check-in, attendee claims Cursor credit(s).
 * Normal guests: 1 per email. Special users (isVolunteer / special user): up to VOLUNTEER_MAX_CLAIMS.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);
    const { email, checkinCode } = validatedData;
    const normalizedEmail = email.toLowerCase().trim();
    const name =
      validatedData.name?.trim() || displayNameFromEmail(normalizedEmail);
    const locale = (body.locale === "en" ? "en" : "zh") as "zh" | "en";
    const redeemMode = getRedeemMode();
    const lumaMode = isLumaRedeemMode();

    console.log(`📝 [REGISTER] Attempt: ${normalizedEmail} mode=${redeemMode}`);

    if (redeemMode === "luma" && !isLumaConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Luma redeem is enabled but LUMA_API_KEY / LUMA_EVENT_ID are missing.",
          code: "LUMA_NOT_CONFIGURED",
        },
        { status: 503 }
      );
    }

    // Venue check-in gate (skipped in Luma mode)
    if (getEventCheckinCode() && !isCheckinCodeValid(checkinCode)) {
      console.log(`❌ [REGISTER] Bad check-in code: ${normalizedEmail}`);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid check-in code. Please check in at the door first.",
          code: "BAD_CHECKIN_CODE",
        },
        { status: 403 }
      );
    }

    // Pull credits from Google Sheet if the pool is empty
    await ensureCreditsSynced();
    // Auto-import bundled Luma guest CSV (534 approved) if not yet loaded
    await ensureBundledLumaGuestsImported();

    // Luma mode: sync checked-in guests, then require email on that list
    if (lumaMode) {
      const luma = await ensureLumaCheckedInUser(normalizedEmail);
      if (!luma.ok) {
        console.log(`❌ [REGISTER] Not checked in on Luma: ${normalizedEmail}`);
        return NextResponse.json(
          {
            success: false,
            error:
              "This email is not checked in on Luma. Please check in at the door first, then try again.",
            code: "NOT_ELIGIBLE",
          },
          { status: 403 }
        );
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
      console.log(`➕ [REGISTER] Walk-up user created: ${normalizedEmail}`);
    }

    if (!eligibleUser) {
      console.log(`❌ [REGISTER] Not eligible: ${normalizedEmail}`);
      return NextResponse.json(
        {
          success: false,
          error: lumaMode
            ? "This email is not checked in on Luma. Please check in at the door first, then try again."
            : "Please ask the staff to check you in on Luma first, then redeem.",
          code: "NOT_ELIGIBLE",
        },
        { status: 403 }
      );
    }

    if (eligibleUser.approvalStatus !== "approved") {
      console.log(
        `⚠️ [REGISTER] Not approved: ${normalizedEmail} (${eligibleUser.approvalStatus})`
      );
      return NextResponse.json(
        {
          success: false,
          error:
            "Your registration is not approved yet. Please contact the organizer.",
          code: "NOT_APPROVED",
        },
        { status: 403 }
      );
    }

    const ownedCount = eligibleUser.ownedCredits?.length
      ? eligibleUser.ownedCredits.length
      : eligibleUser.hasClaimed && eligibleUser.creditId
        ? 1
        : 0;
    const maxClaims = eligibleUser.isVolunteer ? getVolunteerMaxClaims() : 1;
    const canClaimMore = ownedCount < maxClaims;

    // Non-volunteer (or volunteer at cap): re-show latest credit
    if (eligibleUser.hasClaimed && eligibleUser.credit && !canClaimMore) {
      console.log(
        `⚠️ [REGISTER] Already at claim cap (${ownedCount}/${maxClaims}): ${normalizedEmail}`
      );
      return NextResponse.json(
        {
          success: true,
          message: eligibleUser.isVolunteer
            ? "Volunteer claim limit reached. Here is your latest credit:"
            : "You already claimed your credit. Here it is again:",
          credit: eligibleUser.credit.link,
          isExisting: true,
          claimCount: ownedCount,
          maxClaims,
          user: {
            name: eligibleUser.name,
            email: eligibleUser.email,
          },
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
      `✅ [REGISTER] Assigned: ${normalizedEmail} -> ${availableCredit.code} (${newClaimCount}/${maxClaims}${eligibleUser.isVolunteer ? " volunteer" : ""})`
    );

    // No auto-email on claim — guests already get the link on-screen.
    // Reminder outreach uses Notify unclaimed (Cafe Cursor Shanghai 20260719).

    return NextResponse.json(
      {
        success: true,
        message: eligibleUser.isVolunteer
          ? `Volunteer credit #${newClaimCount} assigned:`
          : "Congratulations! Here is your Cursor credit:",
        credit: availableCredit.link,
        isTest: isTestUser,
        claimCount: newClaimCount,
        maxClaims,
        isVolunteer: eligibleUser.isVolunteer,
        user: {
          name: result.name,
          email: result.email,
          company: result.company,
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
 * Public stats (no sensitive data)
 */
export async function GET() {
  try {
    // Auto-import from Google Sheet when pool is empty
    await ensureCreditsSynced();
    // Auto-import bundled Luma guest CSV if allowlist is empty
    await ensureBundledLumaGuestsImported();

    const [availableReal, totalEligible, claimed] = await Promise.all([
      prisma.credit.count({ where: { isUsed: false, isTest: false } }),
      prisma.eligibleUser.count({ where: { approvalStatus: "approved" } }),
      prisma.eligibleUser.count({ where: { hasClaimed: true } }),
    ]);

    return NextResponse.json({
      available: availableReal > 0,
      remaining: availableReal,
      redeemMode: getRedeemMode(),
      requiresCheckinCode: requiresCheckinCode(),
      lumaConfigured: isLumaConfigured(),
      stats: {
        totalEligible,
        claimed,
        pending: Math.max(totalEligible - claimed, 0),
      },
    });
  } catch (error) {
    console.error(`❌ [STATS] Error:`, error);
    return NextResponse.json(
      { available: false, remaining: 0 },
      { status: 500 }
    );
  }
}
