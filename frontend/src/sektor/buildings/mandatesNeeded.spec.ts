import { describe, it, expect } from "vitest";
import { isUnlockedFor, mandatesNeededFor } from "./mandatesNeeded";
import { BuildingDefinition } from "./parseBuildingDefinitions";

function buildingNeeding(mandatesNeeded?: number): BuildingDefinition {
  return { name: "Mine", renderingCodes: [], buildingFunctions: [], properties: { mandatesNeeded } };
}

describe("mandatesNeededFor", () => {
  it("gives the mandates a building needs, and none where its definition names none", () => {
    expect([mandatesNeededFor(buildingNeeding(7)), mandatesNeededFor(buildingNeeding(undefined))]).toEqual([7, 0]);
  });
});

describe("isUnlockedFor", () => {
  // The mine needs 5 mandates completed; the player has completed 4, 5 and 6.
  it("unlocks a building once the player has completed as many mandates as it needs", () => {
    expect([4, 5, 6].map(completedMandateCount => isUnlockedFor(buildingNeeding(5), completedMandateCount)))
      .toEqual([false, true, true]);
  });

  it("unlocks a building needing no mandates for a player who has completed none", () => {
    expect(isUnlockedFor(buildingNeeding(undefined), 0)).toEqual(true);
  });
});
