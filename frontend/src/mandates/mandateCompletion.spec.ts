import { describe, it, expect } from "vitest";
import { isMandateComplete, summedImportsAndExports } from "./mandateCompletion";
import { Mandate, MandateCriterion } from "./mandates.api";

function mandateAsking(...criteria: MandateCriterion[]): Mandate {
  return { number: 1, owner: "Ada", criteria, completed: false };
}

function exportingAtLeast(resourceName: string, amount: number): MandateCriterion {
  return { type: "minimumExport", resourceName, amount };
}

function importingAtMost(resourceName: string, amount: number): MandateCriterion {
  return { type: "maximumImport", resourceName, amount };
}

describe("summedImportsAndExports", () => {
  // What one sektor brings in of a resource is not set against what another sends out of it.
  it("adds up what every sektor brings in and sends out, each on its own", () => {
    expect(summedImportsAndExports([
      { imports: [{ name: "Apples", value: 2 }], exports: [{ name: "Bricks", value: 5 }] },
      { imports: [{ name: "Apples", value: 3 }], exports: [{ name: "Bricks", value: 4 }, { name: "Apples", value: 1 }] },
    ])).toEqual({
      imports: [{ name: "Apples", value: 5 }],
      exports: [{ name: "Bricks", value: 9 }, { name: "Apples", value: 1 }],
    });
  });
});

describe("isMandateComplete", () => {
  const playerImportsAndExports = summedImportsAndExports([
    { imports: [{ name: "Apples", value: 4 }], exports: [{ name: "Bricks", value: 6 }] },
    { imports: [{ name: "Apples", value: 3 }], exports: [{ name: "Bricks", value: 4 }] },
  ]);

  it("completes a minimum export once all the player's sektors together export that much", () => {
    expect([9, 10, 11].map(amount =>
      isMandateComplete(mandateAsking(exportingAtLeast("Bricks", amount)), playerImportsAndExports)
    )).toEqual([true, true, false]);
  });

  it("completes a maximum import while all the player's sektors together import no more than that", () => {
    expect([6, 7, 8].map(amount =>
      isMandateComplete(mandateAsking(importingAtMost("Apples", amount)), playerImportsAndExports)
    )).toEqual([false, true, true]);
  });

  it("leaves a mandate incomplete while any one of its criteria is not fulfilled", () => {
    expect([
      isMandateComplete(mandateAsking(exportingAtLeast("Bricks", 10), importingAtMost("Apples", 7)), playerImportsAndExports),
      isMandateComplete(mandateAsking(exportingAtLeast("Bricks", 10), importingAtMost("Apples", 6)), playerImportsAndExports),
      isMandateComplete(mandateAsking(exportingAtLeast("Bricks", 11), importingAtMost("Apples", 7)), playerImportsAndExports),
    ]).toEqual([true, false, false]);
  });

  // Nothing exported falls short of any minimum, and nothing imported stays under every maximum.
  it("counts a resource the player's sektors do not move as nothing", () => {
    expect([
      isMandateComplete(mandateAsking(exportingAtLeast("Cloth", 1)), playerImportsAndExports),
      isMandateComplete(mandateAsking(importingAtMost("Cloth", 0)), playerImportsAndExports),
    ]).toEqual([false, true]);
  });
});
