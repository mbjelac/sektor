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
  playerPollutionFootprint: 200,
  playerHabitatCount: 3,
  playerPossibleHapiness: 6,
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

  it("asks for a negative resource imported one time in six, drawn of those the planet exports", () => {
    expect(createMandate(1, MATERIALS, drawing(0.1, 0, 0.9999)).criteria).toEqual([
      { type: "minimumImport", resourceName: "Sludge", amount: 50, completed: false },
    ]);
  });

  it("asks for deforestation at most one time in six, drawn as so many forests' worth of support", () => {
    expect([
      createMandate(1, MATERIALS, drawing(0.34, 0)).criteria,
      createMandate(1, MATERIALS, drawing(0.49, 0.5)).criteria,
      createMandate(1, MATERIALS, drawing(0.4, 0.9999)).criteria,
    ]).toEqual([
      [{ type: "maximumDeforestation", amount: 0, completed: false }],
      [{ type: "maximumDeforestation", amount: 50, completed: false }],
      [{ type: "maximumDeforestation", amount: 100, completed: false }],
    ]);
  });

  // The player's polluting buildings can foul 200, ten steps of pollution.
  it("asks for pollution at most one time in six, drawn in steps of pollution up to what the player's buildings can foul", () => {
    expect([
      createMandate(1, MATERIALS, drawing(0.84, 0)).criteria,
      createMandate(1, MATERIALS, drawing(0.9, 0.5)).criteria,
      createMandate(1, MATERIALS, drawing(0.9999, 0.9999)).criteria,
    ]).toEqual([
      [{ type: "maximumPollution", amount: 0, completed: false }],
      [{ type: "maximumPollution", amount: 100, completed: false }],
      [{ type: "maximumPollution", amount: 200, completed: false }],
    ]);
  });

  // The least polluting building can foul 80, four steps of pollution.
  it("asks a player with no polluting building for at most what the least polluting one can foul", () => {
    expect(createMandate(1, { ...MATERIALS, playerPollutionFootprint: 0 }, drawing(0.9, 0.9999)).criteria).toEqual([
      { type: "maximumPollution", amount: 80, completed: false },
    ]);
  });

  // The player has 3 habitats, so is asked for up to 8 habitats' worth of 40 people.
  it("asks for population at least or at most one time in six, drawn in habitats up to five more than the player has", () => {
    expect([
      createMandate(1, MATERIALS, drawing(0.67, 0, 0)).criteria,
      createMandate(1, MATERIALS, drawing(0.8, 0.49, 0.9999)).criteria,
      createMandate(1, MATERIALS, drawing(0.7, 0.5, 0)).criteria,
      createMandate(1, MATERIALS, drawing(0.83, 0.9, 0.9999)).criteria,
    ]).toEqual([
      [{ type: "minimumPopulation", amount: 40, completed: false }],
      [{ type: "minimumPopulation", amount: 320, completed: false }],
      [{ type: "maximumPopulation", amount: 0, completed: false }],
      [{ type: "maximumPopulation", amount: 320, completed: false }],
    ]);
  });

  // The player's habitats could make 6 Hapiness, so they are asked for up to 10.
  it("asks for hapiness at least one time in six, drawn up to a little more than the player's habitats could make", () => {
    expect([
      createMandate(1, MATERIALS, drawing(0.17, 0)).criteria,
      createMandate(1, MATERIALS, drawing(0.33, 0.9999)).criteria,
    ]).toEqual([
      [{ type: "minimumHapiness", amount: 1, completed: false }],
      [{ type: "minimumHapiness", amount: 10, completed: false }],
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
