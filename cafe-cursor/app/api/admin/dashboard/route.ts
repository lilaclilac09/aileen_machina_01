import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { ensureBundledLumaGuestsImported } from "@/lib/luma-csv";

/**
 * GET /api/admin/dashboard — admin stats + lists
 */
export async function GET(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Ensure Luma guest CSV is loaded into EligibleUser
    await ensureBundledLumaGuestsImported();

    const [
      totalCredits,
      usedCredits,
      testCredits,
      totalEligible,
      claimedUsers,
      approvedUsers,
      remindedUnclaimed,
      awaitingReminder,
    ] = await Promise.all([
      prisma.credit.count(),
      prisma.credit.count({ where: { isUsed: true } }),
      prisma.credit.count({ where: { isTest: true } }),
      prisma.eligibleUser.count(),
      prisma.eligibleUser.count({ where: { hasClaimed: true } }),
      prisma.eligibleUser.count({ where: { approvalStatus: "approved" } }),
      prisma.eligibleUser.count({
        where: {
          approvalStatus: "approved",
          hasClaimed: false,
          reminderSentAt: { not: null },
        },
      }),
      prisma.eligibleUser.count({
        where: {
          approvalStatus: "approved",
          hasClaimed: false,
          reminderSentAt: null,
        },
      }),
    ]);

    const credits = await prisma.credit.findMany({
      orderBy: [
        { isUsed: "desc" },
        { assignedAt: "desc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        code: true,
        // Unused pool links stay admin-only in DB; still needed for Copy in UI
        link: true,
        isUsed: true,
        isTest: true,
        assignedAt: true,
        createdAt: true,
        ownerId: true,
      },
    });

    const eligibleUsers = await prisma.eligibleUser.findMany({
      orderBy: [
        { isVolunteer: "desc" },
        { hasClaimed: "desc" },
        { claimedAt: "desc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        role: true,
        approvalStatus: true,
        hasClaimed: true,
        claimedAt: true,
        reminderSentAt: true,
        isVolunteer: true,
        isDoorVolunteer: true,
        createdAt: true,
        creditId: true,
        credit: {
          select: {
            id: true,
            code: true,
            link: true,
            isUsed: true,
            isTest: true,
          },
        },
        ownedCredits: {
          select: { id: true, code: true, isUsed: true },
        },
      },
    });

    const usersWithClaims = eligibleUsers.map((u) => ({
      ...u,
      claimCount: u.ownedCredits.length || (u.hasClaimed ? 1 : 0),
    }));

    return NextResponse.json({
      stats: {
        totalCredits,
        usedCredits,
        availableCredits: totalCredits - usedCredits,
        testCredits,
        realCredits: totalCredits - testCredits,
        totalEligible,
        claimedUsers,
        approvedUsers,
        pendingUsers: approvedUsers - claimedUsers,
        remindedUnclaimed,
        awaitingReminder,
      },
      credits,
      eligibleUsers: usersWithClaims,
    });
  } catch (error) {
    console.error("[ADMIN] Dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
