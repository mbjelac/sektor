import { BuildingDefinition } from "./parseBuildingDefinitions";
import { buildingDefinitions } from "./buildings";

// The buildings a player can put up. No building is locked away from anybody yet, so every building
// a player can put up is available to every player.
export function getAvailableBuildings(): BuildingDefinition[] {
  return buildingDefinitions;
}
