import { describe, it, expect } from "vitest";
import { filterMandates, withoutFulfilledMinimumMandates } from "./mandateFilter";
import { Mandate, MandateCriterion } from "./mandates.api";
import { PlayerTotals } from "./mandateCompletion";

function mandateOf(mandateNumber: number, owner: string | null): Mandate {
  return { number: mandateNumber, owner, criteria: [], completed: false };
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

function mandateAsking(mandateNumber: number, criterion: MandateCriterion): Mandate {
  return { number: mandateNumber, owner: null, criteria: [criterion], completed: false };
}

// The player's sektors send out 20 Apples, house 40 people and make 3 Hapiness, and pollute nothing.
const PLAYER_TOTALS: PlayerTotals = {
  importsAndExports: { imports: [], exports: [{ name: "Apples", value: 20 }] },
  deforestation: 0,
  pollution: 0,
  population: 40,
  hapiness: 3,
};

describe("withoutFulfilledMinimumMandates", () => {
  it("leaves out the mandates asking for at least what the player's sektors already make", () => {
    expect(withoutFulfilledMinimumMandates([
      mandateAsking(1, { type: "minimumExport", resourceName: "Apples", amount: 10, completed: false }),
      mandateAsking(2, { type: "minimumExport", resourceName: "Apples", amount: 30, completed: false }),
      mandateAsking(3, { type: "minimumPopulation", amount: 40, completed: false }),
      mandateAsking(4, { type: "minimumHapiness", amount: 5, completed: false }),
    ], PLAYER_TOTALS).map(mandate => mandate.number)).toEqual([2, 4]);
  });

  it("keeps the mandates asking for at most, whether or not the player's sektors already keep to them", () => {
    expect(withoutFulfilledMinimumMandates([
      mandateAsking(1, { type: "maximumPollution", amount: 100, completed: false }),
      mandateAsking(2, { type: "maximumPopulation", amount: 0, completed: false }),
    ], PLAYER_TOTALS).map(mandate => mandate.number)).toEqual([1, 2]);
  });
});
