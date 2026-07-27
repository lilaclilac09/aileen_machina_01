import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { sendCreditEmail, sendUnclaimedReminderBccBlast, sendUnclaimedReminderTestToOrganizer, getEmailSendConfig } from "@/lib/email";
import { syncReminderSentAtFromResend } from "@/lib/resend-reminder-sync";
import { decryptOrganizerAudit } from "@/lib/organizer-privacy";
import {
  getCreditsSheetCsvUrl,
  syncCreditsFromSheet,
} from "@/lib/google-sheets";
import { displayNameFromEmail } from "@/lib/validations";
import { syncCheckedInFromLuma, isLumaConfigured } from "@/lib/luma";
import { importLumaGuestsFromCsv, clearUnclaimedGuestList } from "@/lib/luma-csv";
import { getVolunteerMaxClaims } from "@/lib/claims";
import { assignableCreditWhere, assignableRealPoolWhere } from "@/lib/credit-pool";
import {
  formatOpsStatsMessage,
  getCreditOpsStats,
  logCreditOpsEvent,
} from "@/lib/credit-ops";

/** Allow bulk notify on Vercel (Resend one-by-one + quota pauses). */
export const maxDuration = 120;

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
          where: assignableCreditWhere(Boolean(useTestCredit)),
          orderBy: { createdAt: "asc" },
        });

        if (!credit) {
          return NextResponse.json(
            {
              error:
                "No fresh credits available (quarantined/revoked links are not reissued — sync new ones from the sheet).",
            },
            { status: 400 }
          );
        }

        await prisma.$transaction(async (tx) => {
          await tx.eligibleUser.update({
            where: { id: eligibleUser.id },
            data: {
              hasClaimed: true,
              claimedAt: new Date(),
              creditId: credit.id,
            },
          });
          await tx.credit.update({
            where: { id: credit.id },
            data: {
              isUsed: true,
              assignedAt: new Date(),
              ownerId: eligibleUser.id,
              timesAssigned: { increment: 1 },
            },
          });
          await logCreditOpsEvent(tx, {
            type: "ASSIGN",
            creditId: credit.id,
            creditCode: credit.code,
            userEmail: email,
            note: "admin_assign",
          });
        });

        console.log(`[ADMIN] Credit assigned: ${email} -> ${credit.code}`);
        const opsStats = await getCreditOpsStats();

        return NextResponse.json({
          success: true,
          message:
            `Credit ${credit.code} assigned to ${email} (${ownedCount + 1}/${maxClaims})\n\n` +
            formatOpsStatsMessage(opsStats),
          credit: credit.link,
          opsStats,
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

        if (!user.hasClaimed || !user.creditId || !user.credit) {
          return NextResponse.json(
            { error: "User has no credit assigned" },
            { status: 400 }
          );
        }

        const revokedCreditId = user.creditId;
        const revokedCode = user.credit.code;

        await prisma.$transaction(async (tx) => {
          await tx.eligibleUser.update({
            where: { id: userId },
            data: {
              hasClaimed: false,
              claimedAt: null,
              creditId: null,
            },
          });
          await tx.credit.update({
            where: { id: revokedCreditId },
            data: {
              isUsed: false,
              assignedAt: null,
              ownerId: null,
              timesRevoked: { increment: 1 },
              lastRevokedAt: new Date(),
              lastRevokedFromEmail: user.email,
            },
          });
          await logCreditOpsEvent(tx, {
            type: "REVOKE",
            creditId: revokedCreditId,
            creditCode: revokedCode,
            userEmail: user.email,
            note: "admin_revoke",
          });
        });

        console.log(`[ADMIN] Credit revoked: ${user.email}`);
        const opsStats = await getCreditOpsStats();

        return NextResponse.json({
          success: true,
          message:
            `Credit revoked from ${user.email} (code ${revokedCode}).\n` +
            `Link is QUARANTINED (not returned to pool) — Cursor.com may already have consumed it.\n` +
            `Guest can redeem again to get a fresh unused link.\n\n` +
            formatOpsStatsMessage(opsStats),
          opsStats,
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
              : user.role === "Special"
                ? user.isDoorVolunteer
                  ? "Volunteer"
                  : "Attendee"
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

      case "TOGGLE_DOOR_VOLUNTEER": {
        const { userId, isDoorVolunteer } = data;
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
          typeof isDoorVolunteer === "boolean"
            ? isDoorVolunteer
            : !user.isDoorVolunteer;
        const updated = await prisma.eligibleUser.update({
          where: { id: userId },
          data: {
            isDoorVolunteer: next,
            role: next
              ? user.isVolunteer
                ? "Special"
                : "Volunteer"
              : user.isVolunteer
                ? "Special"
                : user.role === "Volunteer"
                  ? "Attendee"
                  : user.role,
          },
        });

        console.log(
          `[ADMIN] Door volunteer ${next ? "ON" : "OFF"}: ${updated.email}`
        );

        return NextResponse.json({
          success: true,
          message: next
            ? `${updated.email} marked as volunteer.`
            : `${updated.email} unmarked as volunteer.`,
          isDoorVolunteer: next,
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
            for (const cid of releaseIds) {
              const c = await tx.credit.findUnique({ where: { id: cid } });
              if (!c) continue;
              await tx.credit.update({
                where: { id: cid },
                data: {
                  isUsed: false,
                  assignedAt: null,
                  ownerId: null,
                  timesRevoked: { increment: 1 },
                  lastRevokedAt: new Date(),
                  lastRevokedFromEmail: user.email,
                },
              });
              await logCreditOpsEvent(tx, {
                type: "REVOKE",
                creditId: c.id,
                creditCode: c.code,
                userEmail: user.email,
                note: "delete_user_release",
              });
            }
          }

          await tx.eligibleUser.delete({ where: { id: userId } });
        });

        console.log(
          `[ADMIN] User deleted: ${user.email} (releasedCredits=${releaseIds.length})`
        );
        const opsStats = await getCreditOpsStats();

        return NextResponse.json({
          success: true,
          message:
            (releaseIds.length > 0
              ? `Deleted ${user.email}; ${releaseIds.length} credit(s) QUARANTINED (not reissued — may be consumed on Cursor.com).`
              : `Deleted ${user.email}.`) +
            "\n\n" +
            formatOpsStatsMessage(opsStats),
          releasedCredits: releaseIds.length,
          opsStats,
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
        await logCreditOpsEvent(prisma, {
          type: "ADD",
          creditId: newCredit.id,
          creditCode: newCredit.code,
          note: "admin_add",
        });

        console.log(`[ADMIN] Credit added: ${code}`);
        const opsStats = await getCreditOpsStats();

        return NextResponse.json({
          success: true,
          message:
            `Credit ${code} added to system.\n\n` + formatOpsStatsMessage(opsStats),
          credit: newCredit,
          opsStats,
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
        const opsStats = await getCreditOpsStats();

        console.log(
          `[ADMIN] Sheet sync: cleared=${result.cleared} created=${result.created} skipped=${result.skipped} from ${result.source}`
        );

        return NextResponse.json({
          success: true,
          message:
            `Step1 clear: removed ${result.cleared} unused credits. Step2 sync: ${result.created} new from sheet (${result.skipped} already present / used). ${result.available} available. Kept ${result.keptUsed} used.\n\n` +
            formatOpsStatsMessage(opsStats),
          ...result,
          opsStats,
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

      case "SYNC_REMINDER_FROM_RESEND": {
        const result = await syncReminderSentAtFromResend({ maxPages: 40 });
        console.log(
          `[ADMIN] SYNC_REMINDER_FROM_RESEND: success=${result.success} marked=${result.marked} delivered=${result.deliveredRecipients}`
        );
        if (!result.success) {
          return NextResponse.json(
            {
              error: result.error || "Resend sync failed",
              ...result,
            },
            { status: 500 }
          );
        }
        return NextResponse.json({
          ...result,
          success: true,
          message:
            `Synced Resend subject "${result.subject}": ` +
            `scanned ${result.scanned}, matched ${result.matchedSubject}, ` +
            `delivered recipients ${result.deliveredRecipients}, ` +
            `newly marked ${result.marked}, already marked ${result.alreadyMarked}, ` +
            `not in guest list ${result.notInList}.`,
        });
      }

      case "DECRYPT_ORGANIZER_COPY": {
        const blob = String(data.ciphertext || "").trim();
        if (!blob) {
          return NextResponse.json(
            { error: "Paste the ocopy1.… ciphertext from your encrypted receipt email" },
            { status: 400 }
          );
        }
        try {
          const payload = decryptOrganizerAudit(blob);
          console.log(
            `[ADMIN] DECRYPT_ORGANIZER_COPY: sentCount=${payload.sentCount}`
          );
          return NextResponse.json({
            success: true,
            message: `Decrypted receipt: ${payload.sentCount} recipients @ ${payload.at}`,
            payload,
          });
        } catch (err) {
          return NextResponse.json(
            {
              error:
                err instanceof Error
                  ? err.message
                  : "Decrypt failed — wrong secret or corrupt blob",
            },
            { status: 400 }
          );
        }
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
          ? `\n\nWARNING: From is still ${config.from} — bulk send to guests will fail. Set FROM_EMAIL=Cafe Cursor Shanghai <cafe@aileena.xyz> on Vercel and Redeploy.`
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
                `Cannot notify guests while From is ${config.from}. ` +
                `In Vercel set FROM_EMAIL=Cafe Cursor Shanghai <cafe@aileena.xyz> (Resend domain Verified), then Redeploy.`,
              from: config.from,
            },
            { status: 400 }
          );
        }

        const forceResend = Boolean(data?.forceResend);

        const users = await prisma.eligibleUser.findMany({
          where: {
            approvalStatus: "approved",
            hasClaimed: false,
            ...(forceResend ? {} : { reminderSentAt: null }),
          },
          orderBy: { email: "asc" },
          select: { id: true, email: true, name: true, reminderSentAt: true },
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
            message: forceResend
              ? "No unclaimed approved users to notify."
              : "No unclaimed users left who still need a reminder (all already marked reminded, or none pending). Use force resend to email again.",
            sent: 0,
            failed: 0,
            total: 0,
            from: config.from,
            forceResend,
          });
        }

        const result = await sendUnclaimedReminderBccBlast(
          unique.map((u) => u.email.trim().toLowerCase())
        );

        // Persist reminder markers only for real successful guest sends
        let marked = 0;
        if (!result.simulated && result.sentEmails.length > 0) {
          const now = new Date();
          const updated = await prisma.eligibleUser.updateMany({
            where: {
              email: { in: result.sentEmails },
              hasClaimed: false,
            },
            data: { reminderSentAt: now },
          });
          marked = updated.count;
        }

        console.log(
          `[ADMIN] NOTIFY_UNCLAIMED: total=${unique.length} sent=${result.sent} failed=${result.failed} marked=${marked} force=${forceResend} from=${result.from} simulated=${result.simulated}`
        );

        const simNote = result.simulated
          ? " (dev mode — RESEND_API_KEY not set, emails simulated; DB not marked)"
          : "";

        return NextResponse.json({
          success: result.failed === 0,
          message: `Notified ${result.sent}/${unique.length} (${forceResend ? "force" : "not-yet-reminded"}); marked reminderSentAt=${marked}; encrypted organizer receipt → ${result.cc}; From ${result.from}${
            result.failed ? ` (${result.failed} failed — not marked)` : ""
          }.${simNote}`,
          sent: result.sent,
          failed: result.failed,
          marked,
          total: unique.length,
          batches: result.batches,
          cc: result.cc,
          from: result.from,
          forceResend,
          failures: result.failures.slice(0, 20),
        });
      }

      case "RESOLVE_TICKET": {
        const ticketId = String(data?.ticketId || "").trim();
        if (!ticketId) {
          return NextResponse.json(
            { error: "ticketId required" },
            { status: 400 }
          );
        }
        const adminNote =
          typeof data?.adminNote === "string"
            ? data.adminNote.trim().slice(0, 1000)
            : "";
        const ticket = await prisma.supportTicket.findUnique({
          where: { id: ticketId },
        });
        if (!ticket) {
          return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        }
        const updated = await prisma.supportTicket.update({
          where: { id: ticketId },
          data: {
            status: "done",
            resolvedAt: new Date(),
            ...(adminNote ? { adminNote } : {}),
          },
        });
        console.log(`[ADMIN] RESOLVE_TICKET: ${ticketId} (${ticket.email})`);
        return NextResponse.json({
          success: true,
          message: `Ticket ${ticketId} marked done.`,
          ticket: updated,
        });
      }

      case "REOPEN_TICKET": {
        const ticketId = String(data?.ticketId || "").trim();
        if (!ticketId) {
          return NextResponse.json(
            { error: "ticketId required" },
            { status: 400 }
          );
        }
        const ticket = await prisma.supportTicket.findUnique({
          where: { id: ticketId },
        });
        if (!ticket) {
          return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        }
        const updated = await prisma.supportTicket.update({
          where: { id: ticketId },
          data: { status: "open", resolvedAt: null },
        });
        console.log(`[ADMIN] REOPEN_TICKET: ${ticketId}`);
        return NextResponse.json({
          success: true,
          message: `Ticket ${ticketId} reopened.`,
          ticket: updated,
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
