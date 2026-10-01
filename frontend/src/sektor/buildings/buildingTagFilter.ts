import { BuildingDefinition } from "./parseBuildingDefinitions";

// A building is shown when it has the tag the player picked.
export function isShownByBuildingTag(building: BuildingDefinition, selectedBuildingTag: string): boolean {
  return (building.properties.tags ?? []).includes(selectedBuildingTag);
}
