import { describe, it, expect } from "vitest";
import { completedMandate, PlayerTotals } from "./mandateCompletion";
import { globalImportsAndExports, ImportsAndExports } from "../globalImportsAndExports";
import { Mandate, MandateCriterion } from "./mandates.api";

function mandateAsking(...criteria: MandateCriterion[]): Mandate {
  return { number: 1, owner: "Ada", criteria, completed: false };
}

function exportingAtLeast(resourceName: string, amount: number): MandateCriterion {
  return { type: "minimumExport", resourceName, amount, completed: false };
}

function importingAtMost(resourceName: string, amount: number): MandateCriterion {
  return { type: "maximumImport", resourceName, amount, completed: false };
}

function importingAtLeast(resourceName: string, amount: number): MandateCriterion {
  return { type: "minimumImport", resourceName, amount, completed: false };
}

function deforestingAtMost(amount: number): MandateCriterion {
  return { type: "maximumDeforestation", amount, completed: false };
}

function pollutingAtMost(amount: number): MandateCriterion {
  return { type: "maximumPollution", amount, completed: false };
}

function housingAtLeast(amount: number): MandateCriterion {
  return { type: "minimumPopulation", amount, completed: false };
}

function housingAtMost(amount: number): MandateCriterion {
  return { type: "maximumPopulation", amount, completed: false };
}

function makingHapinessAtLeast(amount: number): MandateCriterion {
  return { type: "minimumHapiness", amount, completed: false };
}

function exportingAtMost(resourceName: string, amount: number): MandateCriterion {
  return { type: "maximumExport", resourceName, amount, completed: false };
}

// The player's sektors move what they are given, are neither deforested nor polluted at all, house
// nobody and make no Hapiness.
function standingAt(importsAndExports: ImportsAndExports): PlayerTotals {
  return { importsAndExports, deforestation: 0, pollution: 0, population: 0, hapiness: 0 };
}

describe("completedMandate", () => {
  const playerImportsAndExports = globalImportsAndExports([
    { imports: [{ name: "Apples", value: 4 }], exports: [{ name: "Bricks", value: 6 }] },
    { imports: [{ name: "Apples", value: 3 }], exports: [{ name: "Bricks", value: 4 }] },
  ]);

  it("completes a minimum export once all the player's sektors together export that much", () => {
    expect([9, 10, 11].map(amount =>
      completedMandate(mandateAsking(exportingAtLeast("Bricks", amount)), standingAt(playerImportsAndExports)).completed
    )).toEqual([true, true, false]);
  });

  it("completes a maximum import while all the player's sektors together import no more than that", () => {
    expect([6, 7, 8].map(amount =>
      completedMandate(mandateAsking(importingAtMost("Apples", amount)), standingAt(playerImportsAndExports)).completed
    )).toEqual([false, true, true]);
  });

  it("completes a minimum import once all the player's sektors together import that much", () => {
    expect([6, 7, 8].map(amount =>
      completedMandate(mandateAsking(importingAtLeast("Apples", amount)), standingAt(playerImportsAndExports)).completed
    )).toEqual([true, true, false]);
  });

  it("completes a maximum export while all the player's sektors together export no more than that", () => {
    expect([9, 10, 11].map(amount =>
      completedMandate(mandateAsking(exportingAtMost("Bricks", amount)), standingAt(playerImportsAndExports)).completed
    )).toEqual([false, true, true]);
  });

  it("leaves a mandate incomplete while any one of its criteria is not completed", () => {
    expect([
      completedMandate(mandateAsking(exportingAtLeast("Bricks", 10), importingAtMost("Apples", 7)), standingAt(playerImportsAndExports)).completed,
      completedMandate(mandateAsking(exportingAtLeast("Bricks", 10), importingAtMost("Apples", 6)), standingAt(playerImportsAndExports)).completed,
      completedMandate(mandateAsking(exportingAtLeast("Bricks", 11), importingAtMost("Apples", 7)), standingAt(playerImportsAndExports)).completed,
    ]).toEqual([true, false, false]);
  });

  it("tells of every criterion whether it is completed", () => {
    expect(completedMandate(mandateAsking(exportingAtLeast("Bricks", 10), importingAtMost("Apples", 6)), standingAt(playerImportsAndExports)))
      .toEqual({
        number: 1,
        owner: "Ada",
        criteria: [
          { type: "minimumExport", resourceName: "Bricks", amount: 10, completed: true },
          { type: "maximumImport", resourceName: "Apples", amount: 6, completed: false },
        ],
        completed: false,
      });
  });

  // One sektor sends out 10 Cloth and another brings in 6, which leaves the player sending out 4 and
  // bringing in none; 4 Dyes brought in against 4 sent out leaves neither.
  it("sets what the player's sektors import of a resource against what they export of it", () => {
    const settledImportsAndExports = globalImportsAndExports([
      { imports: [{ name: "Dyes", value: 4 }], exports: [{ name: "Cloth", value: 10 }] },
      { imports: [{ name: "Cloth", value: 6 }], exports: [{ name: "Dyes", value: 4 }] },
    ]);
    expect([
      completedMandate(mandateAsking(exportingAtLeast("Cloth", 4)), standingAt(settledImportsAndExports)).completed,
      completedMandate(mandateAsking(exportingAtLeast("Cloth", 5)), standingAt(settledImportsAndExports)).completed,
      completedMandate(mandateAsking(importingAtMost("Cloth", 0)), standingAt(settledImportsAndExports)).completed,
      completedMandate(mandateAsking(importingAtLeast("Dyes", 1)), standingAt(settledImportsAndExports)).completed,
      completedMandate(mandateAsking(exportingAtLeast("Dyes", 1)), standingAt(settledImportsAndExports)).completed,
    ]).toEqual([true, false, true, false, false]);
  });

  // Nothing exported falls short of any minimum, and nothing imported stays under every maximum.
  it("counts a resource the player's sektors do not move as nothing", () => {
    expect([
      completedMandate(mandateAsking(exportingAtLeast("Cloth", 1)), standingAt(playerImportsAndExports)).completed,
      completedMandate(mandateAsking(importingAtMost("Cloth", 0)), standingAt(playerImportsAndExports)).completed,
    ]).toEqual([false, true]);
  });

  it("completes a maximum deforestation while all the player's sektors together are deforested no more than that", () => {
    expect([9, 10, 11].map(amount =>
      completedMandate(mandateAsking(deforestingAtMost(amount)), { ...standingAt(playerImportsAndExports), deforestation: 10 }).completed
    )).toEqual([false, true, true]);
  });

  it("completes a maximum pollution while all the player's sektors together are polluted no more than that", () => {
    expect([119, 120, 121].map(amount =>
      completedMandate(mandateAsking(pollutingAtMost(amount)), { ...standingAt(playerImportsAndExports), pollution: 120 }).completed
    )).toEqual([false, true, true]);
  });

  it("completes a minimum population once all the player's sektors together house that many", () => {
    expect([79, 80, 81].map(amount =>
      completedMandate(mandateAsking(housingAtLeast(amount)), { ...standingAt(playerImportsAndExports), population: 80 }).completed
    )).toEqual([true, true, false]);
  });

  it("completes a maximum population while all the player's sektors together house no more than that", () => {
    expect([79, 80, 81].map(amount =>
      completedMandate(mandateAsking(housingAtMost(amount)), { ...standingAt(playerImportsAndExports), population: 80 }).completed
    )).toEqual([false, true, true]);
  });

  it("completes a minimum hapiness once all the player's sektors together make that much", () => {
    expect([11, 12, 13].map(amount =>
      completedMandate(mandateAsking(makingHapinessAtLeast(amount)), { ...standingAt(playerImportsAndExports), hapiness: 12 }).completed
    )).toEqual([true, true, false]);
  });
});
