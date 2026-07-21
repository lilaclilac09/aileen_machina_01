import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { sendCreditEmail, sendUnclaimedReminderBccBlast, sendUnclaimedReminderTestToOrganizer, getEmailSendConfig } from "@/lib/email";
import {
  getCreditsSheetCsvUrl,
  syncCreditsFromSheet,
} from "@/lib/google-sheets";
import { displayNameFromEmail } from "@/lib/validations";
import { syncCheckedInFromLuma, isLumaConfigured } from "@/lib/luma";
import { importLumaGuestsFromCsv, clearUnclaimedGuestList } from "@/lib/luma-csv";
import { getVolunteerMaxClaims } from "@/lib/claims";

/** Allow bulk notify on Vercel (Resend batch). */
export const maxDuration = 60;

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
          include: { ownedCredits: true },
        });

        if (!eligibleUser) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }

        const ownedCount = eligibleUser.ownedCredits.length;
        const maxClaims = eligibleUser.isVolunteer ? getVolunteerMaxClaims() : 1;
        if (ownedCount >= maxClaims) {
          return NextResponse.json(
            {
              error: eligibleUser.isVolunteer
                ? `Special user already has ${ownedCount}/${maxClaims} credits`
                : "User already has a credit assigned",
            },
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
              ownerId: eligibleUser.id,
            },
          }),
        ]);

        console.log(`[ADMIN] Credit assigned: ${email} -> ${credit.code}`);

        return NextResponse.json({
          success: true,
          message: `Credit ${credit.code} assigned to ${email} (${ownedCount + 1}/${maxClaims})`,
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
              ownerId: null,
            },
          }),
        ]);

        console.log(`[ADMIN] Credit revoked: ${user.email}`);

        return NextResponse.json({
          success: true,
          message: `Credit revoked from ${user.email}`,
        });
      }

      case "TOGGLE_VOLUNTEER": {
        const { userId, isVolunteer } = data;
        const user = await prisma.eligibleUser.findUnique({
          where: { id: userId },
        });
        if (!user) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }

        const next =
          typeof isVolunteer === "boolean" ? isVolunteer : !user.isVolunteer;
        const updated = await prisma.eligibleUser.update({
          where: { id: userId },
          data: {
            isVolunteer: next,
            role: next
              ? "Special"
              : user.role === "Special" || user.role === "Volunteer"
                ? "Attendee"
                : user.role,
          },
        });

        console.log(
          `[ADMIN] Special user ${next ? "ON" : "OFF"}: ${updated.email}`
        );

        return NextResponse.json({
          success: true,
          message: next
            ? `${updated.email} marked as special user (can claim up to ${getVolunteerMaxClaims()} credits).`
            : `${updated.email} unmarked as special user (1 credit only).`,
          isVolunteer: next,
          maxClaims: next ? getVolunteerMaxClaims() : 1,
        });
      }

      case "DELETE_ELIGIBLE_USER": {
        const { userId } = data;

        const user = await prisma.eligibleUser.findUnique({
          where: { id: userId },
          include: { ownedCredits: true },
        });

        if (!user) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }

        const ownedIds = user.ownedCredits.map((c) => c.id);
        const creditId = user.creditId;
        const releaseIds = Array.from(
          new Set([...ownedIds, ...(creditId ? [creditId] : [])])
        );

        await prisma.$transaction(async (tx) => {
          await tx.eligibleUser.update({
            where: { id: userId },
            data: {
              hasClaimed: false,
              claimedAt: null,
              creditId: null,
            },
          });

          if (releaseIds.length > 0) {
            await tx.credit.updateMany({
              where: { id: { in: releaseIds } },
              data: {
                isUsed: false,
                assignedAt: null,
                ownerId: null,
              },
            });
          }

          await tx.eligibleUser.delete({ where: { id: userId } });
        });

        console.log(
          `[ADMIN] User deleted: ${user.email} (releasedCredits=${releaseIds.length})`
        );

        return NextResponse.json({
          success: true,
          message:
            releaseIds.length > 0
              ? `Deleted ${user.email} and returned ${releaseIds.length} credit(s) to the pool.`
              : `Deleted ${user.email}.`,
          releasedCredits: releaseIds.length,
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
        /**
         * Credit sync (required order):
         * 1) Clear unused credit pool cache
         * 2) Import links from Google Sheet
         * Used credits are never deleted.
         */
        const csvUrl =
          (typeof data?.csvUrl === "string" && data.csvUrl.trim()) ||
          getCreditsSheetCsvUrl();

        const result = await syncCreditsFromSheet(csvUrl, { clearFirst: true });

        console.log(
          `[ADMIN] Sheet sync: cleared=${result.cleared} created=${result.created} skipped=${result.skipped} from ${result.source}`
        );

        return NextResponse.json({
          success: true,
          message: `Step1 clear: removed ${result.cleared} unused credits. Step2 sync: ${result.created} new from sheet (${result.skipped} already present / used). ${result.available} available. Kept ${result.keptUsed} used.`,
          ...result,
        });
      }

      case "SYNC_LUMA_CHECKED_IN": {
        if (!isLumaConfigured()) {
          return NextResponse.json(
            {
              error:
                "Luma API needs Luma Plus. Without Plus, use Clear + Sync Checked-in (CSV) instead.",
            },
            { status: 400 }
          );
        }

        // Same rule as CSV sync: clear unclaimed cache, then sync.
        const cleared = await clearUnclaimedGuestList();
        const result = await syncCheckedInFromLuma();

        return NextResponse.json({
          success: true,
          message: `Cleared ${cleared.deleted} unclaimed, then synced Luma API checked-in: ${result.checkedIn} guests, ${result.created} new, ${result.updated} updated. Kept ${cleared.keptClaimed} claimed.`,
          cleared: cleared.deleted,
          keptClaimed: cleared.keptClaimed,
          ...result,
        });
      }

      case "IMPORT_LUMA_CSV": {
        const csvText =
          typeof data?.csvText === "string" ? data.csvText : "";
        if (!csvText.trim()) {
          return NextResponse.json(
            { error: "csvText is required (paste or upload Luma guest CSV)." },
            { status: 400 }
          );
        }

        const onlyApproved = data?.onlyApproved !== false;
        const onlyCheckedIn = data?.onlyCheckedIn === true;
        const revokeOthers = data?.revokeOthers === true;

        try {
          const result = await importLumaGuestsFromCsv(csvText, {
            onlyApproved,
            onlyCheckedIn,
            revokeOthers,
          });

          return NextResponse.json({
            success: true,
            message: `Imported Luma CSV: ${result.created} new, ${result.updated} updated, ${result.skipped} already claimed, ${result.declined} declined (not in filter). Matched ${result.imported} of ${result.parsed} rows. Checked-in in file: ${result.checkedInInFile}.`,
            ...result,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Import failed";
          return NextResponse.json({ error: msg }, { status: 400 });
        }
      }

      case "CLEAR_GUEST_LIST": {
        // Remove allowlist rows that have not claimed. Claimed users (and their
        // credit links) are kept for audit / re-show.
        const keepClaimed = data?.keepClaimed !== false;

        if (!keepClaimed) {
          return NextResponse.json(
            {
              error:
                "Refusing to delete claimed users. Clear unclaimed only (keepClaimed=true).",
            },
            { status: 400 }
          );
        }

        const cleared = await clearUnclaimedGuestList();

        return NextResponse.json({
          success: true,
          message: `Guest list cleared: deleted ${cleared.deleted} unclaimed users. Kept ${cleared.keptClaimed} who already claimed.`,
          deleted: cleared.deleted,
          keptClaimed: cleared.keptClaimed,
        });
      }

      case "SYNC_CHECKED_IN_ALLOWLIST": {
        /**
         * Door-day guest sync (required order):
         * 1) Clear unclaimed allowlist cache
         * 2) Import only checked_in_at rows from the uploaded CSV
         * Never skip step 1 — old guests must not linger.
         */
        const csvText =
          typeof data?.csvText === "string" ? data.csvText : "";
        if (!csvText.trim()) {
          return NextResponse.json(
            { error: "csvText is required (upload a fresh Luma guest CSV)." },
            { status: 400 }
          );
        }

        const cleared = await clearUnclaimedGuestList();

        try {
          const result = await importLumaGuestsFromCsv(csvText, {
            onlyApproved: true,
            onlyCheckedIn: true,
            revokeOthers: true,
          });

          return NextResponse.json({
            success: true,
            message: `Step1 clear: removed ${cleared.deleted} unclaimed. Step2 sync: ${result.created} new / ${result.updated} updated (matched ${result.imported}, checked-in in file ${result.checkedInInFile}). Kept ${cleared.keptClaimed} claimed. Declined leftovers: ${result.declined}.`,
            cleared: cleared.deleted,
            keptClaimed: cleared.keptClaimed,
            ...result,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Sync failed";
          return NextResponse.json(
            {
              error: `Step1 clear done (${cleared.deleted} removed), but Step2 sync failed: ${msg}`,
              cleared: cleared.deleted,
            },
            { status: 400 }
          );
        }
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

      case "NOTIFY_UNCLAIMED_TEST": {
        const config = getEmailSendConfig();
        const result = await sendUnclaimedReminderTestToOrganizer();
        console.log(
          `[ADMIN] NOTIFY_UNCLAIMED_TEST: to=${result.to} success=${result.success} simulated=${result.simulated} from=${config.from}`
        );
        if (!result.success) {
          return NextResponse.json(
            {
              error: `Test email failed: ${result.error || "unknown"}\nFrom: ${config.from}`,
              to: result.to,
              from: config.from,
            },
            { status: 500 }
          );
        }
        const fromHint = config.testingOnlyFrom
          ? `\n\nWARNING: From is still ${config.from} — bulk send to guests will fail. Set FROM_EMAIL=Cafe Cursor Shanghai <cafe@aileena.xyz> on o6o4 and Redeploy.`
          : `\nFrom: ${config.from}`;
        return NextResponse.json({
          success: true,
          message: result.simulated
            ? `Test simulated to ${result.to} (RESEND_API_KEY not set).`
            : `Test email sent to ${result.to} only. Subject starts with [TEST]. Check inbox/spam, then Notify unclaimed if OK.${fromHint}`,
          to: result.to,
          from: config.from,
          testingOnlyFrom: config.testingOnlyFrom,
          simulated: result.simulated,
        });
      }

      case "NOTIFY_UNCLAIMED": {
        const config = getEmailSendConfig();
        if (config.testingOnlyFrom) {
          return NextResponse.json(
            {
              error:
                `Cannot BCC guests while From is ${config.from}. ` +
                `In Vercel o6o4 set FROM_EMAIL=Cafe Cursor Shanghai <cafe@aileena.xyz> (Resend domain Verified), then Redeploy.`,
              from: config.from,
            },
            { status: 400 }
          );
        }

        const users = await prisma.eligibleUser.findMany({
          where: {
            approvalStatus: "approved",
            hasClaimed: false,
          },
          orderBy: { email: "asc" },
          select: { id: true, email: true, name: true },
        });

        // Deduplicate by email
        const seen = new Set<string>();
        const unique = users.filter((u) => {
          const key = u.email.trim().toLowerCase();
          if (!key.includes("@") || seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        if (unique.length === 0) {
          return NextResponse.json({
            success: true,
            message: "No unclaimed approved users to notify.",
            sent: 0,
            failed: 0,
            total: 0,
            from: config.from,
          });
        }

        const result = await sendUnclaimedReminderBccBlast(
          unique.map((u) => u.email.trim().toLowerCase())
        );

        console.log(
          `[ADMIN] NOTIFY_UNCLAIMED: total=${unique.length} sent=${result.sent} failed=${result.failed} batches=${result.batches} cc=${result.cc} from=${config.from} simulated=${result.simulated}`
        );

        const simNote = result.simulated
          ? " (dev mode — RESEND_API_KEY not set, emails simulated)"
          : "";

        return NextResponse.json({
          success: result.failed === 0,
          message: `Notified ${result.sent}/${unique.length} unclaimed users (private 1:1); organizer copy ${result.cc}; From ${result.from}${
            result.failed ? ` (${result.failed} failed)` : ""
          }.${simNote}`,
          sent: result.sent,
          failed: result.failed,
          total: unique.length,
          batches: result.batches,
          cc: result.cc,
          from: result.from,
          failures: result.failures.slice(0, 20),
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
