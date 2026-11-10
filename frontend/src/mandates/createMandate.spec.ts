import { describe, it, expect } from "vitest";
import { createMandate, MandateMaterials } from "./createMandate";

// The planet brings in 30 Apples and 10 Cloth, none of Bricks, and sends out 40 Sludge and none of
// Smoke.
const MATERIALS: MandateMaterials = {
  positiveResourceNames: ["Apples", "Bricks", "Cloth"],
  negativeResourceNames: ["Smoke", "Sludge"],
  planetImportsAndExports: {
    imports: [{ name: "Apples", value: 30 }, { name: "Cloth", value: 10 }],
    exports: [{ name: "Sludge", value: 40 }],
  },
};

// Every draw falls where the test says, one after the other.
function drawing(...draws: number[]): () => number {
  return () => draws.shift()!;
}

describe("createMandate", () => {
  it("asks for a positive resource exported", () => {
    expect(createMandate(7, MATERIALS, drawing(0.5, 0, 0.5))).toEqual({
      number: 7,
      owner: null,
      criteria: [{ type: "minimumExport", resourceName: "Apples", amount: 28, completed: false }],
      completed: false,
    });
  });

  // Apples are brought in three times as much as Cloth, so take up the first three quarters of the
  // draws; Bricks, which the planet does not bring in, take up none.
  it("draws a positive resource as likely as the planet imports it", () => {
    expect([
      createMandate(1, MATERIALS, drawing(0.5, 0.74, 0)).criteria,
      createMandate(1, MATERIALS, drawing(0.5, 0.75, 0)).criteria,
    ]).toEqual([
      [{ type: "minimumExport", resourceName: "Apples", amount: 5, completed: false }],
      [{ type: "minimumExport", resourceName: "Cloth", amount: 5, completed: false }],
    ]);
  });

  it("asks for a negative resource imported one time in three, drawn of those the planet exports", () => {
    expect(createMandate(1, MATERIALS, drawing(0.3, 0, 0.9999)).criteria).toEqual([
      { type: "minimumImport", resourceName: "Sludge", amount: 50, completed: false },
    ]);
  });

  it("draws any resource while the planet moves none of them", () => {
    expect(createMandate(1, { ...MATERIALS, planetImportsAndExports: { imports: [], exports: [] } }, drawing(0.5, 0.5, 0)).criteria).toEqual([
      { type: "minimumExport", resourceName: "Bricks", amount: 5, completed: false },
    ]);
  });

  it("asks for positive resources whatever the draw while there are no negative ones", () => {
    expect(createMandate(1, { ...MATERIALS, negativeResourceNames: [] }, drawing(0.05, 0.9, 0)).criteria).toEqual([
      { type: "minimumExport", resourceName: "Cloth", amount: 5, completed: false },
    ]);
  });
});
