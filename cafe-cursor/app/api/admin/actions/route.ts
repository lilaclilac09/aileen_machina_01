import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { sendCreditEmail } from "@/lib/email";
import {
  getCreditsSheetCsvUrl,
  syncCreditsFromSheet,
} from "@/lib/google-sheets";
import { displayNameFromEmail } from "@/lib/validations";

/**
 * POST /api/admin/actions — run admin actions
 */
export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, data } = body;

    console.log(`[ADMIN] Action: ${action}`);

    switch (action) {
      case "ASSIGN_CREDIT": {
        const { email, useTestCredit } = data;

        const eligibleUser = await prisma.eligibleUser.findUnique({
          where: { email },
        });

        if (!eligibleUser) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }

        if (eligibleUser.hasClaimed) {
          return NextResponse.json(
            { error: "User already has a credit assigned" },
            { status: 400 }
          );
        }

        const credit = await prisma.credit.findFirst({
          where: {
            isUsed: false,
            isTest: useTestCredit || false,
          },
          orderBy: { createdAt: "asc" },
        });

        if (!credit) {
          return NextResponse.json(
            { error: "No credits available" },
            { status: 400 }
          );
        }

        await prisma.$transaction([
          prisma.eligibleUser.update({
            where: { id: eligibleUser.id },
            data: {
              hasClaimed: true,
              claimedAt: new Date(),
              creditId: credit.id,
            },
          }),
          prisma.credit.update({
            where: { id: credit.id },
            data: {
              isUsed: true,
              assignedAt: new Date(),
            },
          }),
        ]);

        console.log(`[ADMIN] Credit assigned: ${email} -> ${credit.code}`);

        return NextResponse.json({
          success: true,
          message: `Credit ${credit.code} assigned to ${email}`,
          credit: credit.link,
        });
      }

      case "REVOKE_CREDIT": {
        const { userId } = data;

        const user = await prisma.eligibleUser.findUnique({
          where: { id: userId },
          include: { credit: true },
        });

        if (!user) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }

        if (!user.hasClaimed || !user.creditId) {
          return NextResponse.json(
            { error: "User has no credit assigned" },
            { status: 400 }
          );
        }

        await prisma.$transaction([
          prisma.eligibleUser.update({
            where: { id: userId },
            data: {
              hasClaimed: false,
              claimedAt: null,
              creditId: null,
            },
          }),
          prisma.credit.update({
            where: { id: user.creditId },
            data: {
              isUsed: false,
              assignedAt: null,
            },
          }),
        ]);

        console.log(`[ADMIN] Credit revoked: ${user.email}`);

        return NextResponse.json({
          success: true,
          message: `Credit revoked from ${user.email}`,
        });
      }

      case "ADD_ELIGIBLE_USER": {
        const { email, name, company, approvalStatus } = data;
        const normalizedEmail = String(email || "")
          .toLowerCase()
          .trim();

        if (!normalizedEmail) {
          return NextResponse.json(
            { error: "Email is required" },
            { status: 400 }
          );
        }

        const existing = await prisma.eligibleUser.findUnique({
          where: { email: normalizedEmail },
        });

        if (existing) {
          return NextResponse.json(
            { error: "User already exists" },
            { status: 400 }
          );
        }

        const displayName =
          (typeof name === "string" && name.trim()) ||
          displayNameFromEmail(normalizedEmail);

        const newUser = await prisma.eligibleUser.create({
          data: {
            email: normalizedEmail,
            name: displayName,
            company: company || null,
            approvalStatus: approvalStatus || "approved",
          },
        });

        console.log(`[ADMIN] Eligible user added: ${normalizedEmail}`);

        return NextResponse.json({
          success: true,
          message: `User ${normalizedEmail} added`,
          user: newUser,
        });
      }

      case "UPDATE_USER_STATUS": {
        const { userId, approvalStatus } = data;

        await prisma.eligibleUser.update({
          where: { id: userId },
          data: { approvalStatus },
        });

        console.log(
          `[ADMIN] User status updated: ${userId} -> ${approvalStatus}`
        );

        return NextResponse.json({
          success: true,
          message: `Status updated to ${approvalStatus}`,
        });
      }

      case "ADD_CREDIT": {
        const { code, link, isTest } = data;

        const existing = await prisma.credit.findFirst({
          where: { code },
        });

        if (existing) {
          return NextResponse.json(
            { error: "Credit code already exists" },
            { status: 400 }
          );
        }

        const newCredit = await prisma.credit.create({
          data: {
            code,
            link,
            isTest: isTest || false,
          },
        });

        console.log(`[ADMIN] Credit added: ${code}`);

        return NextResponse.json({
          success: true,
          message: `Credit ${code} added`,
          credit: newCredit,
        });
      }

      case "DELETE_CREDIT": {
        const { creditId } = data;

        const credit = await prisma.credit.findUnique({
          where: { id: creditId },
        });

        if (!credit) {
          return NextResponse.json(
            { error: "Credit not found" },
            { status: 404 }
          );
        }

        if (credit.isUsed) {
          return NextResponse.json(
            { error: "Cannot delete an assigned credit" },
            { status: 400 }
          );
        }

        await prisma.credit.delete({
          where: { id: creditId },
        });

        console.log(`[ADMIN] Credit deleted: ${credit.code}`);

        return NextResponse.json({
          success: true,
          message: `Credit ${credit.code} deleted`,
        });
      }

      case "SYNC_CREDITS_FROM_SHEET": {
        const csvUrl =
          (typeof data?.csvUrl === "string" && data.csvUrl.trim()) ||
          getCreditsSheetCsvUrl();

        const result = await syncCreditsFromSheet(csvUrl);

        console.log(
          `[ADMIN] Sheet sync: created=${result.created} skipped=${result.skipped} from ${result.source}`
        );

        return NextResponse.json({
          success: true,
          message: `Synced from Google Sheet: ${result.created} new, ${result.skipped} already present. ${result.available} real credits available.`,
          ...result,
        });
      }

      case "SEND_CREDIT_EMAIL": {
        const { userId, locale } = data;

        const user = await prisma.eligibleUser.findUnique({
          where: { id: userId },
          include: { credit: true },
        });

        if (!user) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }

        if (!user.hasClaimed || !user.credit) {
          return NextResponse.json(
            { error: "User has no credit assigned" },
            { status: 400 }
          );
        }

        const emailResult = await sendCreditEmail({
          to: user.email,
          name: user.name,
          creditLink: user.credit.link,
          creditCode: user.credit.code,
          company: user.company || undefined,
          isTest: user.credit.isTest,
          locale: locale || "zh",
        });

        if (!emailResult.success) {
          console.error(
            `[ADMIN] Email failed for ${user.email}:`,
            emailResult.error
          );
          return NextResponse.json(
            { error: `Failed to send email: ${emailResult.error}` },
            { status: 500 }
          );
        }

        console.log(`[ADMIN] Email sent to: ${user.email}`);

        return NextResponse.json({
          success: true,
          message: `Email sent to ${user.email}`,
        });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[ADMIN] Action error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
