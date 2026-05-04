import assert from "node:assert/strict";
import { computeCommissionCents } from "../src/lib/commission";

assert.equal(computeCommissionCents(10000, { mode: "PERCENTAGE", percentage: 5, fixedCents: 0 }), 500);
assert.equal(computeCommissionCents(10000, { mode: "FIXED", percentage: 0, fixedCents: 200 }), 200);
assert.equal(computeCommissionCents(10000, { mode: "BOTH", percentage: 10, fixedCents: 50 }), 1050);
console.log("smoke-test: commission math OK");
