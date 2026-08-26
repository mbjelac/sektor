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
    properties: {},
  },
];

function createSektor(): Sektor {
  return new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, { importRestrictions: [], exportRequirements: [] }, []);
}

describe("destroyBuilding", () => {
  it("fails when no building at location", () => {
    const sektor = createSektor();

    const result = sektor.destroyBuilding({ x: 0, y: 0 });

    expect(result).toEqual({ success: false, error: "buildingNotFound" });
  });

  it("removes the building", () => {
    const sektor = createSektor();
    sektor.loadState({
      buildings: [
        { type: "Mill", location: { x: 0, y: 0 } },
        { type: "Farm", location: { x: 1, y: 0 } },
      ],
    });

    const result = sektor.destroyBuilding({ x: 0, y: 0 });

    expect({
      result,
      destroyedBuildingState: sektor.getBuildingState({ x: 0, y: 0 }),
      remainingBuildings: sektor.getState().buildings,
    }).toEqual({
      result: { success: true },
      destroyedBuildingState: null,
      remainingBuildings: [{ type: "Farm", location: { x: 1, y: 0 } }],
    });
  });

  it("removes the destroyed building's inputs and outputs from imports and exports", () => {
    const sektor = createSektor();
    sektor.loadState({
      buildings: [
        { type: "Mill", location: { x: 0, y: 0 } },
        { type: "Farm", location: { x: 1, y: 0 } },
      ],
    });

    sektor.destroyBuilding({ x: 0, y: 0 });

    expect(sektor.getSektorState()).toEqual({
      imports: [
        { name: "Water", value: 2, score: -4 },
      ],
      exports: [
        { name: "Wheat", value: 5, score: 10 },
      ],
      status: "Done",
      importRestrictions: [],
      exportRequirements: [],
    });
  });
});
