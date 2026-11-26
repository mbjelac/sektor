import { describe, it, expect } from "vitest";
import { allowedSektorCount, mandatesToNextAllowance, sektorAllowance } from "./sektorAllowance";
import { Mandate } from "./mandates/mandates.api";

function mandateOf(owner: string | null, completed: boolean): Mandate {
  return { number: 1, owner, criteria: [], completed };
}

function completedMandatesOf(owner: string, count: number): Mandate[] {
  return Array.from({ length: count }, () => mandateOf(owner, true));
}

describe("sektorAllowance", () => {
  // Ada owns 1 sektor and completed 4 mandates, then 2 sektors and completed 5, then 2 sektors and 4.
  it("lets the player claim only while they own fewer sektors than their completed mandates allow", () => {
    expect([
      sektorAllowance(["Ada"], completedMandatesOf("Ada", 4), "Ada"),
      sektorAllowance(["Ada", "Bea"], completedMandatesOf("Ada", 5), "Ada"),
      sektorAllowance(["Ada", "Ada"], completedMandatesOf("Ada", 5), "Ada"),
      sektorAllowance(["Ada", "Ada"], completedMandatesOf("Ada", 4), "Ada"),
    ]).toEqual([
      { canClaimSektors: false, mandatesToNextAllowance: 1 },
      { canClaimSektors: true, mandatesToNextAllowance: 5 },
      { canClaimSektors: false, mandatesToNextAllowance: 5 },
      { canClaimSektors: false, mandatesToNextAllowance: 1 },
    ]);
  });

  it("counts only the player's completed mandates", () => {
    expect(sektorAllowance([null], [
      ...completedMandatesOf("Bea", 5),
      mandateOf("Ada", false),
      mandateOf("Ada", true),
    ], "Ada")).toEqual({ canClaimSektors: true, mandatesToNextAllowance: 4 });
  });
});

describe("allowedSektorCount", () => {
  it("allows one sektor more for every 5 completed mandates", () => {
    expect([0, 4, 5, 9, 10, 14].map(allowedSektorCount)).toEqual([1, 1, 2, 2, 3, 3]);
  });
});

describe("mandatesToNextAllowance", () => {
  it("counts the mandates still to complete until one sektor more is allowed", () => {
    expect([0, 14, 23].map(mandatesToNextAllowance)).toEqual([5, 1, 2]);
  });
});
