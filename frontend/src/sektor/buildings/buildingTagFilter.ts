import { BuildingDefinition } from "./parseBuildingDefinitions";

// A player who has picked no tag is looking for no building in particular, so every building is
// shown. Otherwise a building is shown when it has the picked tag.
export function isShownByBuildingTag(building: BuildingDefinition, selectedBuildingTag: string | null): boolean {
  if (selectedBuildingTag === null) return true;
  return (building.properties.tags ?? []).includes(selectedBuildingTag);
}
