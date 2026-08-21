import { describe, it, expect } from "vitest";
import { Sektor } from "./Sektor";
import { BuildingDefinition } from "./buildings/parseBuildingDefinitions";

const testDefinitions: BuildingDefinition[] = [
  {
    name: "Mill",
    renderingCode: "box s(1,1,1)",
    buildingFunction: {
      inputs: [
        { name: "Wheat", value: 4 },
        { name: "Energy", value: 2 },
      ],
      outputs: [
        { name: "Flour", value: 3 },
      ],
    },
    outputModifiers: [],
    properties: {},
  },
  {
    name: "Farm",
    renderingCode: "box s(1,1,1)",
    buildingFunction: {
      inputs: [{ name: "Water", value: 2 }],
      outputs: [{ name: "Wheat", value: 5 }],
    },
    outputModifiers: [{ resource: "Wheat", property: "soil" }],
    properties: {},
  },
];

function createSektor(): Sektor {
  return new Sektor([[{ properties: { soil: 2 } }]], testDefinitions, { importRestrictions: [], exportRequirements: [] });
}

describe("getBuildingState", () => {
  it("returns null when no building at location", () => {
    const sektor = createSektor();

    expect(sektor.getBuildingState({ x: 0, y: 0 })).toEqual(null);
  });

  it("returns building function and outputs for a placed building", () => {
    const sektor = createSektor();
    sektor.createBuilding({ type: "Mill", location: { x: 0, y: 0 } });

    expect(sektor.getBuildingState({ x: 0, y: 0 })).toEqual({
      buildingFunction: {
        inputs: [
          { name: "Wheat", value: 4 },
          { name: "Energy", value: 2 },
        ],
        outputs: [
          { name: "Flour", value: 3 },
        ],
      },
      modifiedOutputs: [
        { name: "Flour", value: 3 },
      ],
    });
  });

  it("returns outputs modified by location properties", () => {
    const sektor = createSektor();
    sektor.createBuilding({ type: "Farm", location: { x: 0, y: 0 } });

    expect(sektor.getBuildingState({ x: 0, y: 0 })!.modifiedOutputs).toEqual([
      { name: "Wheat", value: 7 },
    ]);
  });
});
