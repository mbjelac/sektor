import { describe, it, expect } from "vitest";
import { isShownByBuildingTag } from "./buildingTagFilter";
import { BuildingDefinition } from "./parseBuildingDefinitions";

const orchard: BuildingDefinition = { name: "Orchard", renderingCode: "", buildingFunctions: [], properties: { tags: ["fruit"] } };
const smelter: BuildingDefinition = { name: "Smelter", renderingCode: "", buildingFunctions: [], properties: { tags: ["metal", "heat"] } };
const statue: BuildingDefinition = { name: "Statue", renderingCode: "", buildingFunctions: [], properties: {} };
const buildings = [orchard, smelter, statue];

function shownBuildingNames(selectedBuildingTag: string | null): string[] {
  return buildings
    .filter(building => isShownByBuildingTag(building, selectedBuildingTag))
    .map(building => building.name);
}

describe("isShownByBuildingTag", () => {
  it("shows every building when no tag is selected", () => {
    expect(shownBuildingNames(null)).toEqual(["Orchard", "Smelter", "Statue"]);
  });

  it("shows only buildings having the selected tag", () => {
    expect(shownBuildingNames("heat")).toEqual(["Smelter"]);
  });
});
