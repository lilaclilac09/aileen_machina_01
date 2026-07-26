/**
 * Verify have/need formatting never emits empty amounts.
 * Run: npx tsx scripts/verify-credit-ledger.ts
 */

import {
  computeHaveNeed,
  formatHaveNeed,
  getCreditDenominationUsd,
} from "../lib/credit-ledger";

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

assert(formatHaveNeed(1500, 2500) === "have $1500, need $2500", "numbers");
assert(formatHaveNeed(undefined, 50) === "have unknown, need $50", "have unknown");
assert(formatHaveNeed(30, null) === "have $30, need unknown", "need unknown");
assert(!formatHaveNeed(undefined, undefined).includes("have ,"), "no empty have");
assert(!formatHaveNeed(undefined, undefined).includes("need …"), "no empty need");

const ledger = computeHaveNeed({
  availableCount: 30,
  unclaimedApprovedCount: 50,
  denominationUsd: 50,
});
assert(ledger.haveUsd === 1500, "haveUsd");
assert(ledger.needUsd === 2500, "needUsd");
assert(ledger.shortUsd === 1000, "shortUsd");
assert(ledger.canAutoDetectFaceValue === false, "no auto-detect");
assert(ledger.label === "have $1500, need $2500", "label");

console.log("OK credit-ledger");
console.log("denomination default:", getCreditDenominationUsd());
console.log(ledger.label, "| short $", ledger.shortUsd);
