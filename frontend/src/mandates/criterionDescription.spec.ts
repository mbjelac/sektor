import { describe, it, expect } from "vitest";
import { criterionDescription } from "./criterionDescription";

describe("criterionDescription", () => {
  it("tells a minimum export and a maximum import in full", () => {
    expect([
      criterionDescription({ type: "minimumExport", resourceName: "Apples", amount: 12 }, "🍎"),
      criterionDescription({ type: "maximumImport", resourceName: "Bricks", amount: 7 }, "🧱"),
    ]).toEqual([
      "Export at least 12 🍎 Apples",
      "Import at most 7 🧱 Bricks",
    ]);
  });

  it("names a resource without a picture by its name alone", () => {
    expect(criterionDescription({ type: "minimumExport", resourceName: "Apples", amount: 12 }, null))
      .toEqual("Export at least 12 Apples");
  });
});
