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
    ] = await Promise.all([
      prisma.credit.count(),
      prisma.credit.count({ where: { isUsed: true } }),
      prisma.credit.count({ where: { isTest: true } }),
      prisma.eligibleUser.count(),
      prisma.eligibleUser.count({ where: { hasClaimed: true } }),
      prisma.eligibleUser.count({ where: { approvalStatus: "approved" } }),
    ]);

    const credits = await prisma.credit.findMany({
      orderBy: [
        { isUsed: "desc" },
        { assignedAt: "desc" },
        { createdAt: "desc" },
      ],
    });

    const eligibleUsers = await prisma.eligibleUser.findMany({
      orderBy: [
        { hasClaimed: "desc" },
        { claimedAt: "desc" },
        { createdAt: "desc" },
      ],
      include: {
        credit: true,
      },
    });

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
      },
      credits,
      eligibleUsers,
    });
  } catch (error) {
    console.error("[ADMIN] Dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
