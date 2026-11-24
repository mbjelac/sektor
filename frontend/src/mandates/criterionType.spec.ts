import { describe, it, expect } from "vitest";
import { asksForAtLeast, isAboutExports, isMinimumCriterion, isSameCriterion } from "./criterionType";
import { MandateCriterion, ResourceCriterion } from "./mandates.api";

describe("criterion types", () => {
  it("tells of every kind of criterion whether it is about exports and whether it asks for at least", () => {
    expect((["minimumExport", "maximumExport", "minimumImport", "maximumImport"] as ResourceCriterion["type"][])
      .map(type => {
        const criterion: ResourceCriterion = { type, resourceName: "Apples", amount: 5, completed: false };
        return { type, aboutExports: isAboutExports(criterion), atLeast: asksForAtLeast(criterion) };
      }))
      .toEqual([
        { type: "minimumExport", aboutExports: true, atLeast: true },
        { type: "maximumExport", aboutExports: true, atLeast: false },
        { type: "minimumImport", aboutExports: false, atLeast: true },
        { type: "maximumImport", aboutExports: false, atLeast: false },
      ]);
  });

  it("tells of every kind of criterion whether it is a minimum criterion", () => {
    const criteria: MandateCriterion[] = [
      { type: "minimumExport", resourceName: "Apples", amount: 5, completed: false },
      { type: "maximumExport", resourceName: "Apples", amount: 5, completed: false },
      { type: "minimumImport", resourceName: "Apples", amount: 5, completed: false },
      { type: "maximumImport", resourceName: "Apples", amount: 5, completed: false },
      { type: "maximumDeforestation", amount: 5, completed: false },
      { type: "maximumPollution", amount: 5, completed: false },
      { type: "minimumPopulation", amount: 5, completed: false },
      { type: "maximumPopulation", amount: 5, completed: false },
      { type: "minimumHapiness", amount: 5, completed: false },
    ];
    expect(criteria.map(criterion => ({ type: criterion.type, isMinimum: isMinimumCriterion(criterion) }))).toEqual([
      { type: "minimumExport", isMinimum: true },
      { type: "maximumExport", isMinimum: false },
      { type: "minimumImport", isMinimum: true },
      { type: "maximumImport", isMinimum: false },
      { type: "maximumDeforestation", isMinimum: false },
      { type: "maximumPollution", isMinimum: false },
      { type: "minimumPopulation", isMinimum: true },
      { type: "maximumPopulation", isMinimum: false },
      { type: "minimumHapiness", isMinimum: true },
    ]);
  });

  // Every criterion is set against exporting at least 10 Metals, and against polluting at most 100.
  it("tells the same criterion by its type and resource, whatever its amount", () => {
    const metalsExport: MandateCriterion = { type: "minimumExport", resourceName: "Metals", amount: 10, completed: false };
    const pollution: MandateCriterion = { type: "maximumPollution", amount: 100, completed: false };
    const criteria: MandateCriterion[] = [
      { type: "minimumExport", resourceName: "Metals", amount: 30, completed: false },
      { type: "minimumExport", resourceName: "Glass", amount: 10, completed: false },
      { type: "maximumExport", resourceName: "Metals", amount: 10, completed: false },
      { type: "maximumPollution", amount: 300, completed: false },
      { type: "maximumDeforestation", amount: 100, completed: false },
    ];
    expect(criteria.map(criterion => ({
      sameAsMetalsExport: isSameCriterion(criterion, metalsExport),
      sameAsPollution: isSameCriterion(criterion, pollution),
    }))).toEqual([
      { sameAsMetalsExport: true, sameAsPollution: false },
      { sameAsMetalsExport: false, sameAsPollution: false },
      { sameAsMetalsExport: false, sameAsPollution: false },
      { sameAsMetalsExport: false, sameAsPollution: true },
      { sameAsMetalsExport: false, sameAsPollution: false },
    ]);
  });
});
