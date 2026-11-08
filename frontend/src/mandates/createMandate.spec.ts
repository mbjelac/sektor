import { describe, it, expect } from "vitest";
import { createMandate, MandateMaterials } from "./createMandate";

// Cloth is woven of a little Dyes and many Apples, and of Care, which cannot be imported; Bricks are
// made of nothing.
const MATERIALS: MandateMaterials = {
  positiveResourceNames: ["Apples", "Bricks", "Cloth", "Dyes"],
  negativeResourceNames: ["Sludge"],
  productions: [
    { outputName: "Cloth", outputAmount: 2, inputs: [{ name: "Dyes", value: 1 }, { name: "Apples", value: 4 }, { name: "Care", value: 1 }] },
    { outputName: "Bricks", outputAmount: 1, inputs: [] },
  ],
};

// Every draw falls where the test says, one after the other.
function drawing(...draws: number[]): () => number {
  return () => draws.shift()!;
}

describe("createMandate", () => {
  // The strategy draw lands among the positive mandates; Cloth is drawn of the two made resources
  // and 28 of it is to be exported; both importable inputs are restricted, Apples first as Cloth takes
  // more of it: making 28 Cloth takes 56 Apples, of which three quarters may be imported, and 14 Dyes,
  // of which half may be.
  it("asks for a positive resource exported and only so much of its inputs imported", () => {
    expect(createMandate(7, MATERIALS, drawing(0.5, 0.5, 0.5, 0, 0.9, 0.5, 0))).toEqual({
      number: 7,
      owner: null,
      criteria: [
        { type: "minimumExport", resourceName: "Cloth", amount: 28, completed: false },
        { type: "maximumImport", resourceName: "Apples", amount: 42, completed: false },
        { type: "maximumImport", resourceName: "Dyes", amount: 7, completed: false },
      ],
      completed: false,
    });
  });

  // Drawn as high as a share goes, the imports still fall short of the 56 Apples and 14 Dyes making
  // 28 Cloth takes, Apples being held to 50 besides.
  it("always allows less of an input imported than the export needs", () => {
    expect(createMandate(1, MATERIALS, drawing(0.5, 0.5, 0.5, 0, 0.9, 0.9999, 0.9999)).criteria).toEqual([
      { type: "minimumExport", resourceName: "Cloth", amount: 28, completed: false },
      { type: "maximumImport", resourceName: "Apples", amount: 50, completed: false },
      { type: "maximumImport", resourceName: "Dyes", amount: 13, completed: false },
    ]);
  });

  // Making 5 Cloth takes 10 Apples, which can be held to 5, but only 2.5 Dyes, which no amount of 5
  // or more holds below what it takes.
  it("leaves an input unrestricted while the export needs no more than the lowest amount of it", () => {
    expect(createMandate(1, MATERIALS, drawing(0.5, 0.5, 0, 0, 0.9, 0)).criteria).toEqual([
      { type: "minimumExport", resourceName: "Cloth", amount: 5, completed: false },
      { type: "maximumImport", resourceName: "Apples", amount: 5, completed: false },
    ]);
  });

  it("restricts the imports of the inputs taken most of first", () => {
    expect(createMandate(1, MATERIALS, drawing(0.5, 0.5, 0.5, 0, 0, 0.5)).criteria).toEqual([
      { type: "minimumExport", resourceName: "Cloth", amount: 28, completed: false },
      { type: "maximumImport", resourceName: "Apples", amount: 42, completed: false },
    ]);
  });

  it("restricts no imports of a resource made of nothing that can be imported", () => {
    expect(createMandate(1, MATERIALS, drawing(0.5, 0, 0.9999, 0)).criteria).toEqual([
      { type: "minimumExport", resourceName: "Bricks", amount: 50, completed: false },
    ]);
  });

  it("asks for a negative resource imported one time in ten, and only so much of one exported another", () => {
    expect([
      createMandate(1, MATERIALS, drawing(0.05, 0, 0.5)).criteria,
      createMandate(1, MATERIALS, drawing(0.15, 0, 0)).criteria,
    ]).toEqual([
      [{ type: "minimumImport", resourceName: "Sludge", amount: 28, completed: false }],
      [{ type: "maximumExport", resourceName: "Sludge", amount: 5, completed: false }],
    ]);
  });

  it("asks for positive resources whatever the draw while there are no negative ones", () => {
    expect(createMandate(1, { ...MATERIALS, negativeResourceNames: [] }, drawing(0.05, 0, 0, 0)).criteria).toEqual([
      { type: "minimumExport", resourceName: "Bricks", amount: 5, completed: false },
    ]);
  });
});
