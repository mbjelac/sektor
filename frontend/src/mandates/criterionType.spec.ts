import { describe, it, expect } from "vitest";
import { asksForAtLeast, isAboutExports } from "./criterionType";
import { MandateCriterion } from "./mandates.api";

describe("criterion types", () => {
  it("tells of every kind of criterion whether it is about exports and whether it asks for at least", () => {
    expect((["minimumExport", "maximumExport", "minimumImport", "maximumImport"] as MandateCriterion["type"][])
      .map(type => {
        const criterion: MandateCriterion = { type, resourceName: "Apples", amount: 5, completed: false };
        return { type, aboutExports: isAboutExports(criterion), atLeast: asksForAtLeast(criterion) };
      }))
      .toEqual([
        { type: "minimumExport", aboutExports: true, atLeast: true },
        { type: "maximumExport", aboutExports: true, atLeast: false },
        { type: "minimumImport", aboutExports: false, atLeast: true },
        { type: "maximumImport", aboutExports: false, atLeast: false },
      ]);
  });
});
