/**
 * Credit ops audit — ADD / ASSIGN / REVOKE counts + quarantined (revoked) flags.
 */

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  assignableRealPoolWhere,
  quarantinedCreditWhere,
} from "@/lib/credit-pool";

export type CreditOpsType = "ADD" | "ASSIGN" | "REVOKE";

export type CreditOpsStats = {
  addedToSystem: number;
  assignEvents: number;
  revokeEvents: number;
  /** Was assigned then revoked — quarantined, not reissued */
  revokedAvailableCount: number;
  usedCount: number;
  /** Fresh pool only (never assigned) */
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
    prisma.credit.count({ where: quarantinedCreditWhere() }),
    prisma.credit.count({ where: { isUsed: true, isTest: false } }),
    prisma.credit.count({ where: assignableRealPoolWhere() }),
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
    `Quarantined (revoked, not reissued): ${stats.revokedAvailableCount}`,
    `Pool now — fresh available: ${stats.availableCount}, used: ${stats.usedCount}`,
  ].join("\n");
}
