import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { sendCreditEmail } from "@/lib/email";
import {
  getCreditsSheetCsvUrl,
  syncCreditsFromSheet,
} from "@/lib/google-sheets";
import { displayNameFromEmail } from "@/lib/validations";
import { syncCheckedInFromLuma, isLumaConfigured } from "@/lib/luma";
import { importLumaGuestsFromCsv } from "@/lib/luma-csv";

/**
 * POST /api/admin/actions — run admin actions
 */
export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json(
        { error: "未登录" },
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
            { error: "用户不存在" },
            { status: 404 }
          );
        }

        if (eligibleUser.hasClaimed) {
          return NextResponse.json(
            { error: "该用户已分配学分" },
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
            { error: "没有可用学分" },
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
          message: `已将学分 ${credit.code} 分配给 ${email}`,
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
            { error: "用户不存在" },
            { status: 404 }
          );
        }

        if (!user.hasClaimed || !user.creditId) {
          return NextResponse.json(
            { error: "该用户尚未分配学分" },
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
          message: `已撤销 ${user.email} 的学分`,
        });
      }

      case "ADD_ELIGIBLE_USER": {
        const { email, name, company, approvalStatus } = data;
        const normalizedEmail = String(email || "")
          .toLowerCase()
          .trim();

        if (!normalizedEmail) {
          return NextResponse.json(
            { error: "请填写邮箱" },
            { status: 400 }
          );
        }

        const existing = await prisma.eligibleUser.findUnique({
          where: { email: normalizedEmail },
        });

        if (existing) {
          return NextResponse.json(
            { error: "用户已存在" },
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
          message: `已添加用户 ${normalizedEmail}`,
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
          message: `状态已更新为 ${approvalStatus}`,
        });
      }

      case "ADD_CREDIT": {
        const { code, link, isTest } = data;

        const existing = await prisma.credit.findFirst({
          where: { code },
        });

        if (existing) {
          return NextResponse.json(
            { error: "学分代码已存在" },
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
          message: `已添加学分 ${code}`,
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
            { error: "学分不存在" },
            { status: 404 }
          );
        }

        if (credit.isUsed) {
          return NextResponse.json(
            { error: "已分配的学分不能删除" },
            { status: 400 }
          );
        }

        await prisma.credit.delete({
          where: { id: creditId },
        });

        console.log(`[ADMIN] Credit deleted: ${credit.code}`);

        return NextResponse.json({
          success: true,
          message: `已删除学分 ${credit.code}`,
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
          message: `Sheet 同步完成：新增 ${result.created}，已存在跳过 ${result.skipped}，可用正式学分 ${result.available}`,
          ...result,
        });
      }

      case "SYNC_LUMA_CHECKED_IN": {
        if (!isLumaConfigured()) {
          return NextResponse.json(
            {
              error:
                "Luma API 需要 Luma Plus。没有 Plus 请用「导入 Luma CSV」（活动 → 嘉宾 → 下载 CSV）。",
            },
            { status: 400 }
          );
        }

        const result = await syncCheckedInFromLuma();

        return NextResponse.json({
          success: true,
          message: `Luma 签到同步：${result.checkedIn} 人，新增 ${result.created}，更新 ${result.updated}`,
          ...result,
        });
      }

      case "IMPORT_LUMA_CSV": {
        const csvText =
          typeof data?.csvText === "string" ? data.csvText : "";
        if (!csvText.trim()) {
          return NextResponse.json(
            { error: "请上传 Luma 嘉宾 CSV 文件" },
            { status: 400 }
          );
        }

        const onlyApproved = data?.onlyApproved !== false;
        const onlyCheckedIn = data?.onlyCheckedIn === true;

        const result = await importLumaGuestsFromCsv(csvText, {
          onlyApproved,
          onlyCheckedIn,
        });

        return NextResponse.json({
          success: true,
          message: `Luma CSV 导入完成：新增 ${result.created}，更新 ${result.updated}，已领取跳过 ${result.skipped}（导入 ${result.imported}/${result.parsed}）。文件中已签到：${result.checkedInInFile}`,
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
            { error: "用户不存在" },
            { status: 404 }
          );
        }

        if (!user.hasClaimed || !user.credit) {
          return NextResponse.json(
            { error: "该用户尚未分配学分" },
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
            { error: `邮件发送失败：${emailResult.error}` },
            { status: 500 }
          );
        }

        console.log(`[ADMIN] Email sent to: ${user.email}`);

        return NextResponse.json({
          success: true,
          message: `邮件已发送至 ${user.email}`,
        });
      }

      default:
        return NextResponse.json(
          { error: "无效操作" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[ADMIN] Action error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
