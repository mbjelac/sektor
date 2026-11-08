import { describe, it, expect } from "vitest";
import { mandateCounts } from "./mandateCounts";
import { Mandate } from "./mandates.api";

function mandateOf(owner: string | null, completed: boolean): Mandate {
  return { number: 1, owner, criteria: [], completed };
}

describe("mandateCounts", () => {
  it("counts the player's claimed mandates, completed and not, leaving out everybody else's", () => {
    expect(mandateCounts([
      mandateOf("Ada", false),
      mandateOf("Ada", true),
      mandateOf("Ada", false),
      mandateOf("Bea", true),
      mandateOf(null, false),
    ], "Ada")).toEqual({ incomplete: 2, complete: 1, claimed: 3 });
  });

  it("counts nothing for somebody not logged in", () => {
    expect(mandateCounts([mandateOf(null, false)], null)).toEqual({ incomplete: 0, complete: 0, claimed: 0 });
  });
});
