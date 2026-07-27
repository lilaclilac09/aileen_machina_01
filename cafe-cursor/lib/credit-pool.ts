/**
 * Assignable credit pool — never re-issue a link that was already handed out.
 *
 * Why: Cursor.com referral links may be consumed when the guest opens them.
 * Our DB cannot see Cursor-side redemption. If Admin Revokes and we put the
 * same link back into Available, the next guest may get a dead/burned link.
 *
 * Rule: only credits with timesAssigned === 0 (never assigned) are assignable.
 * Revoke frees the guest to claim again, but quarantines that link.
 */

export type AssignableCreditFilter = {
  isUsed: false;
  isTest: boolean;
  ownerId: null;
  timesAssigned: 0;
};

export function assignableCreditWhere(
  isTest: boolean = false
): AssignableCreditFilter {
  return {
    isUsed: false,
    isTest,
    ownerId: null,
    timesAssigned: 0,
  };
}

/** Real (non-test) stock for Have/Need + ops "available" counts. */
export function assignableRealPoolWhere() {
  return assignableCreditWhere(false);
}

/** Quarantined: was assigned and later revoked — do not reassign. */
export function quarantinedCreditWhere() {
  return {
    isUsed: false as const,
    isTest: false as const,
    timesAssigned: { gt: 0 as const },
  };
}
