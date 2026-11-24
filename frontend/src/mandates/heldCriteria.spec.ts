import { describe, it, expect } from "vitest";
import { heldCriteria } from "./heldCriteria";
import { Mandate, MandateCriterion } from "./mandates.api";

function mandateOf(mandateNumber: number, owner: string | null, criterion: MandateCriterion): Mandate {
  return { number: mandateNumber, owner, criteria: [criterion], completed: false };
}

const METALS_EXPORT_OF_10: MandateCriterion = { type: "minimumExport", resourceName: "Metals", amount: 10, completed: false };
const POLLUTION_OF_150: MandateCriterion = { type: "maximumPollution", amount: 150, completed: false };

// Ada holds a mandate exporting at least 10 Metals and one polluting at most 150; Bea holds one
// housing at least 40 people.
const MANDATES = [
  mandateOf(1, "Ada", METALS_EXPORT_OF_10),
  mandateOf(2, "Ada", POLLUTION_OF_150),
  mandateOf(3, "Bea", { type: "minimumPopulation", amount: 40, completed: false }),
];

describe("heldCriteria", () => {
  it("gives the criteria of the player's own mandates which a mandate shares", () => {
    expect([
      heldCriteria(mandateOf(4, null, { type: "minimumExport", resourceName: "Metals", amount: 30, completed: false }), MANDATES, "Ada"),
      heldCriteria(mandateOf(5, null, { type: "maximumPollution", amount: 100, completed: false }), MANDATES, "Ada"),
      heldCriteria(mandateOf(6, null, { type: "minimumPopulation", amount: 80, completed: false }), MANDATES, "Ada"),
      heldCriteria(mandateOf(7, null, { type: "minimumExport", resourceName: "Glass", amount: 10, completed: false }), MANDATES, "Ada"),
    ]).toEqual([[METALS_EXPORT_OF_10], [POLLUTION_OF_150], [], []]);
  });

  it("gives somebody not logged in no criteria held", () => {
    expect(heldCriteria(mandateOf(4, null, METALS_EXPORT_OF_10), MANDATES, null)).toEqual([]);
  });
});
