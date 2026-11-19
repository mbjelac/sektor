import { describe, it, expect } from "vitest";
import { criterionDescription, CriterionDescription } from "./criterionDescription";

// The description read as one line of words.
function told(description: CriterionDescription): string {
  return `${description.beforeAmount}${description.amount}${description.afterAmount}`;
}

describe("criterionDescription", () => {
  it("sets the amount apart from the words before and after it", () => {
    expect(criterionDescription({ type: "minimumExport", resourceName: "Apples", amount: 12, completed: false }, "🍎"))
      .toEqual({ beforeAmount: "Export at least ", amount: "12", afterAmount: " 🍎 Apples" });
  });

  it("tells every kind of criterion in full", () => {
    expect([
      told(criterionDescription({ type: "minimumExport", resourceName: "Apples", amount: 12, completed: false }, "🍎")),
      told(criterionDescription({ type: "maximumExport", resourceName: "Apples", amount: 9, completed: false }, "🍎")),
      told(criterionDescription({ type: "minimumImport", resourceName: "Bricks", amount: 8, completed: false }, "🧱")),
      told(criterionDescription({ type: "maximumImport", resourceName: "Bricks", amount: 7, completed: false }, "🧱")),
    ]).toEqual([
      "Export at least 12 🍎 Apples",
      "Export at most 9 🍎 Apples",
      "Import at least 8 🧱 Bricks",
      "Import at most 7 🧱 Bricks",
    ]);
  });

  it("tells deforestation at most in full", () => {
    expect(told(criterionDescription({ type: "maximumDeforestation", amount: 15, completed: false }, null)))
      .toEqual("Deforestation at most 15");
  });

  it("tells pollution at most in full", () => {
    expect(told(criterionDescription({ type: "maximumPollution", amount: 60, completed: false }, null)))
      .toEqual("Pollution at most 60");
  });

  it("tells population at least and at most in full", () => {
    expect([
      told(criterionDescription({ type: "minimumPopulation", amount: 80, completed: false }, null)),
      told(criterionDescription({ type: "maximumPopulation", amount: 40, completed: false }, null)),
    ]).toEqual(["Population at least 80", "Population at most 40"]);
  });

  it("tells hapiness at least in full", () => {
    expect(told(criterionDescription({ type: "minimumHapiness", amount: 8, completed: false }, null)))
      .toEqual("Hapiness at least 8");
  });

  it("names a resource without a picture by its name alone", () => {
    expect(told(criterionDescription({ type: "minimumExport", resourceName: "Apples", amount: 12, completed: false }, null)))
      .toEqual("Export at least 12 Apples");
  });
});
