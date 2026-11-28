import { BuildingDefinition } from "./parseBuildingDefinitions";

// A building is unlocked for a player once they have completed as many mandates as it needs.
export function isUnlockedFor(building: BuildingDefinition, completedMandateCount: number): boolean {
  return completedMandateCount >= mandatesNeededFor(building);
}

// How many more mandates a player has to complete before the building is unlocked for them, none once
// it is.
export function mandatesStillNeeded(building: BuildingDefinition, completedMandateCount: number): number {
  return Math.max(0, mandatesNeededFor(building) - completedMandateCount);
}

// A building whose definition names no number of mandates needed needs none.
export function mandatesNeededFor(building: BuildingDefinition): number {
  return building.properties.mandatesNeeded ?? 0;
}
