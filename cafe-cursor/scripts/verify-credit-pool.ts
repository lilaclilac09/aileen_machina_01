/**
 * Offline: quarantined (once-assigned) credits must not match assignable filter.
 * Run: npx tsx scripts/verify-credit-pool.ts
 */
import {
  assignableCreditWhere,
  assignableRealPoolWhere,
  quarantinedCreditWhere,
} from "../lib/credit-pool";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const fresh = assignableCreditWhere(false);
assert(fresh.timesAssigned === 0, "fresh timesAssigned 0");
assert(fresh.isUsed === false, "fresh unused");
assert(fresh.ownerId === null, "fresh no owner");

const q = quarantinedCreditWhere();
assert(q.timesAssigned.gt === 0, "quarantine timesAssigned > 0");
assert(q.isUsed === false, "quarantine unused in DB");

const real = assignableRealPoolWhere();
assert(real.isTest === false, "real pool non-test");

console.log("verify-credit-pool: ok");
