import { describe, it, expect } from "vitest";
import { criterionDescription } from "./criterionDescription";

describe("criterionDescription", () => {
  it("tells every kind of criterion in full", () => {
    expect([
      criterionDescription({ type: "minimumExport", resourceName: "Apples", amount: 12, completed: false }, "🍎"),
      criterionDescription({ type: "maximumExport", resourceName: "Apples", amount: 9, completed: false }, "🍎"),
      criterionDescription({ type: "minimumImport", resourceName: "Bricks", amount: 8, completed: false }, "🧱"),
      criterionDescription({ type: "maximumImport", resourceName: "Bricks", amount: 7, completed: false }, "🧱"),
    ]).toEqual([
      "Export at least 12 🍎 Apples",
      "Export at most 9 🍎 Apples",
      "Import at least 8 🧱 Bricks",
      "Import at most 7 🧱 Bricks",
    ]);
  });

  it("names a resource without a picture by its name alone", () => {
    expect(criterionDescription({ type: "minimumExport", resourceName: "Apples", amount: 12, completed: false }, null))
      .toEqual("Export at least 12 Apples");
  });
});
