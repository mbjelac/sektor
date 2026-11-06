import { describe, it, expect } from "vitest";
import { filterMandates } from "./mandateFilter";
import { Mandate } from "./mandates.api";

function mandateOf(mandateNumber: number, owner: string | null): Mandate {
  return { number: mandateNumber, owner, criteria: [] };
}

const MANDATES = [mandateOf(1, null), mandateOf(2, "Ada"), mandateOf(3, "Bea"), mandateOf(4, null)];

describe("filterMandates", () => {
  it("keeps the mandates nobody owns, or those of the player", () => {
    expect({
      unclaimed: filterMandates(MANDATES, "unclaimed", "Ada").map(mandate => mandate.number),
      own: filterMandates(MANDATES, "own", "Ada").map(mandate => mandate.number),
    }).toEqual({ unclaimed: [1, 4], own: [2] });
  });

  it("gives somebody not logged in no mandates of their own", () => {
    expect(filterMandates(MANDATES, "own", null)).toEqual([]);
  });
});
