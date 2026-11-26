import { describe, it, expect } from "vitest";
import { canClaimMandates, countMandatesTakingSlot } from "./mandateCap";
import { Mandate } from "./mandates.api";

function mandateOf(owner: string | null, completed: boolean): Mandate {
  return { number: 1, owner, criteria: [], completed };
}

describe("canClaimMandates", () => {
  // Ada works on 2, 3 and 4 mandates, and has 3 completed besides in every case.
  it("lets the player claim only while they work on fewer than 3 mandates", () => {
    const completedMandates = [mandateOf("Ada", true), mandateOf("Ada", true), mandateOf("Ada", true)];
    expect([2, 3, 4].map(incompleteCount => canClaimMandates([
      ...completedMandates,
      ...Array.from({ length: incompleteCount }, () => mandateOf("Ada", false)),
    ], "Ada"))).toEqual([true, false, false]);
  });
});

describe("countMandatesTakingSlot", () => {
  it("counts only the player's mandates not yet completed", () => {
    expect(countMandatesTakingSlot([
      mandateOf("Ada", false),
      mandateOf("Ada", true),
      mandateOf("Ada", true),
      mandateOf("Bea", false),
      mandateOf(null, false),
    ], "Ada")).toEqual(1);
  });
});
