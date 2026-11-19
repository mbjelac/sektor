import { describe, it, expect } from "vitest";
import { mandateCategory } from "./mandateCategory";
import { Mandate, MandateCriterion } from "./mandates.api";

function mandateAsking(...criteria: MandateCriterion[]): Mandate {
  return { number: 1, owner: null, criteria, completed: false };
}

describe("mandateCategory", () => {
  it("is the category the first criterion of a mandate is about, and economic for one asking nothing", () => {
    expect([
      mandateAsking({ type: "minimumExport", resourceName: "Apples", amount: 5, completed: false }),
      mandateAsking({ type: "maximumImport", resourceName: "Apples", amount: 5, completed: false }),
      mandateAsking({ type: "maximumDeforestation", amount: 5, completed: false }),
      mandateAsking({ type: "maximumPollution", amount: 20, completed: false }),
      mandateAsking({ type: "minimumPopulation", amount: 40, completed: false }),
      mandateAsking({ type: "maximumPopulation", amount: 40, completed: false }),
      mandateAsking({ type: "minimumHapiness", amount: 3, completed: false }),
      mandateAsking(),
    ].map(mandateCategory)).toEqual(["economic", "economic", "ecologic", "ecologic", "social", "social", "social", "economic"]);
  });
});
