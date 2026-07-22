import { describe, it, expect } from "vitest";
import { Sektor } from "./Sektor";
import { BuildingDefinition } from "./buildings/parseBuildingDefinitions";

const testDefinitions: BuildingDefinition[] = [
  {
    name: "Mill",
    renderingCode: "box s(1,1,1)",
    buildingFunction: {
      inputs: [{ name: "Wheat", value: 4 }],
      outputs: [{ name: "Flour", value: 3 }],
    },
    outputModifiers: [],
    boosters: [],
    properties: {},
  },
  {
    name: "Farm",
    renderingCode: "box s(1,1,1)",
    buildingFunction: {
      inputs: [{ name: "Water", value: 2 }],
      outputs: [{ name: "Wheat", value: 5 }],
    },
    outputModifiers: [],
    boosters: [],
    properties: {},
  },
];

describe("doesBuildingNeedMoreInput", () => {
  it("returns true when the input is not fully supplied by its sources", () => {
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, { importRestrictions: [], exportRequirements: [] });
    sektor.createBuilding({ type: "Mill", location: { x: 0, y: 0 } });
    sektor.createBuilding({ type: "Farm", location: { x: 1, y: 0 } });
    sektor.createBuilding({ type: "Farm", location: { x: 2, y: 0 } });
    sektor.addConnection({ x: 0, y: 0 }, { x: 1, y: 0 }, "Wheat");
    sektor.addConnection({ x: 0, y: 0 }, { x: 2, y: 0 }, "Wheat");

    const result = sektor.doesBuildingNeedMoreInput({ x: 0, y: 0 }, "Wheat");

    expect(result).toEqual(true);
  });

  it("returns false when the input is fully supplied by its sources", () => {
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, { importRestrictions: [], exportRequirements: [] });
    sektor.createBuilding({ type: "Mill", location: { x: 0, y: 0 } });
    sektor.createBuilding({ type: "Farm", location: { x: 1, y: 0 } });
    sektor.createBuilding({ type: "Farm", location: { x: 2, y: 0 } });
    sektor.addConnection({ x: 0, y: 0 }, { x: 1, y: 0 }, "Wheat");
    sektor.addConnection({ x: 0, y: 0 }, { x: 2, y: 0 }, "Wheat");
    sektor.changeConnectionAmount({ x: 0, y: 0 }, { x: 1, y: 0 }, "Wheat", 1);
    sektor.changeConnectionAmount({ x: 0, y: 0 }, { x: 2, y: 0 }, "Wheat", 1);

    const result = sektor.doesBuildingNeedMoreInput({ x: 0, y: 0 }, "Wheat");

    expect(result).toEqual(false);
  });
});
