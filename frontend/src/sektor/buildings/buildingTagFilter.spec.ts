import { describe, it, expect } from "vitest";
import { isShownByBuildingTag } from "./buildingTagFilter";
import { BuildingDefinition } from "./parseBuildingDefinitions";

const orchard: BuildingDefinition = { name: "Orchard", renderingCodes: [], buildingFunctions: [], properties: { tags: ["fruit"] } };
const smelter: BuildingDefinition = { name: "Smelter", renderingCodes: [], buildingFunctions: [], properties: { tags: ["metal", "heat"] } };
const statue: BuildingDefinition = { name: "Statue", renderingCodes: [], buildingFunctions: [], properties: {} };
const buildings = [orchard, smelter, statue];

function shownBuildingNames(selectedBuildingTag: string): string[] {
  return buildings
    .filter(building => isShownByBuildingTag(building, selectedBuildingTag))
    .map(building => building.name);
}

describe("isShownByBuildingTag", () => {
  it("shows only buildings having the selected tag", () => {
    expect(shownBuildingNames("heat")).toEqual(["Smelter"]);
  });
});
