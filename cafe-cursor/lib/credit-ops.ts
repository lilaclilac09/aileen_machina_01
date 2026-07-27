/**
 * Credit ops audit — ADD / ASSIGN / REVOKE counts + revoked-but-available flags.
 */

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CreditOpsType = "ADD" | "ASSIGN" | "REVOKE";

export type CreditOpsStats = {
  addedToSystem: number;
  assignEvents: number;
  revokeEvents: number;
  revokedAvailableCount: number;
  usedCount: number;
  availableCount: number;
};

type Db = Prisma.TransactionClient | typeof prisma;

export async function logCreditOpsEvent(
  db: Db,
  input: {
    type: CreditOpsType;
    creditId?: string | null;
    creditCode?: string | null;
    userEmail?: string | null;
    note?: string | null;
  }
) {
  await db.creditOpsEvent.create({
    data: {
      type: input.type,
      creditId: input.creditId || null,
      creditCode: input.creditCode || null,
      userEmail: input.userEmail || null,
      note: input.note || null,
    },
  });
}

export async function getCreditOpsStats(): Promise<CreditOpsStats> {
  const [
    addedToSystem,
    assignEvents,
    revokeEvents,
    revokedAvailableCount,
    usedCount,
    availableCount,
  ] = await Promise.all([
    prisma.creditOpsEvent.count({ where: { type: "ADD" } }),
    prisma.creditOpsEvent.count({ where: { type: "ASSIGN" } }),
    prisma.creditOpsEvent.count({ where: { type: "REVOKE" } }),
    prisma.credit.count({
      where: { timesRevoked: { gt: 0 }, isUsed: false, isTest: false },
    }),
    prisma.credit.count({ where: { isUsed: true, isTest: false } }),
    prisma.credit.count({
      where: { isUsed: false, isTest: false, ownerId: null },
    }),
  ]);

  return {
    addedToSystem,
    assignEvents,
    revokeEvents,
    revokedAvailableCount,
    usedCount,
    availableCount,
  };
}

export function formatOpsStatsMessage(stats: CreditOpsStats): string {
  return [
    `Added to system (ADD events): ${stats.addedToSystem}`,
    `Assign events: ${stats.assignEvents}`,
    `Revoke events: ${stats.revokeEvents}`,
    `Revoked & available (not kept): ${stats.revokedAvailableCount}`,
    `Pool now — available: ${stats.availableCount}, used: ${stats.usedCount}`,
  ].join("\n");
}
