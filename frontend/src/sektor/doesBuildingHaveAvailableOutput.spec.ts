import { describe, it, expect } from "vitest";
import { Sektor } from "./Sektor";
import { BuildingDefinition } from "./buildings/parseBuildingDefinitions";

const testDefinitions: BuildingDefinition[] = [
  {
    name: "Mill",
    renderingCode: "box s(1,1,1)",
    buildingFunction: {
      inputs: [{ name: "Wheat", value: 5 }],
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
      outputs: [{ name: "Wheat", value: 4 }],
    },
    outputModifiers: [],
    boosters: [],
    properties: {},
  },
];

describe("doesBuildingHaveAvailableOutput", () => {
  it("returns true when the output is not fully consumed by its targets", () => {
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, { importRestrictions: [], exportRequirements: [] });
    sektor.loadState({
      buildings: [
        { type: "Farm", location: { x: 0, y: 0 } },
        { type: "Mill", location: { x: 1, y: 0 } },
        { type: "Mill", location: { x: 2, y: 0 } },
      ],
      connections: [],
    });
    sektor.addConnection({ x: 1, y: 0 }, { x: 0, y: 0 }, "Wheat");
    sektor.addConnection({ x: 2, y: 0 }, { x: 0, y: 0 }, "Wheat");

    const result = sektor.doesBuildingHaveAvailableOutput({ x: 0, y: 0 }, "Wheat");

    expect(result).toEqual(true);
  });

  it("returns false when the output is fully consumed by its targets", () => {
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, { importRestrictions: [], exportRequirements: [] });
    sektor.loadState({
      buildings: [
        { type: "Farm", location: { x: 0, y: 0 } },
        { type: "Mill", location: { x: 1, y: 0 } },
        { type: "Mill", location: { x: 2, y: 0 } },
      ],
      connections: [],
    });
    sektor.addConnection({ x: 1, y: 0 }, { x: 0, y: 0 }, "Wheat");
    sektor.addConnection({ x: 2, y: 0 }, { x: 0, y: 0 }, "Wheat");
    sektor.changeConnectionAmount({ x: 1, y: 0 }, { x: 0, y: 0 }, "Wheat", 1);
    sektor.changeConnectionAmount({ x: 2, y: 0 }, { x: 0, y: 0 }, "Wheat", 1);

    const result = sektor.doesBuildingHaveAvailableOutput({ x: 0, y: 0 }, "Wheat");

    expect(result).toEqual(false);
  });
});
