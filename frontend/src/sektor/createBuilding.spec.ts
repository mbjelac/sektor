import { describe, it, expect } from "vitest";
import { Sektor } from "./Sektor";
import { BuildingDefinition } from "./buildings/parseBuildingDefinitions";

function buildingDefinition(name: string, inputs: { name: string, value: number }[], outputs: { name: string, value: number }[]): BuildingDefinition {
  return {
    name,
    renderingCode: "box s(1,1,1)",
    buildingFunction: { inputs, outputs },
    outputModifiers: [],
    properties: {},
  };
}

const testDefinitions: BuildingDefinition[] = [
  buildingDefinition("Mill", [{ name: "Wheat", value: 4 }], [{ name: "Flour", value: 3 }]),
  buildingDefinition("Well", [], [{ name: "Water", value: 1 }]),
  buildingDefinition("WheatFarm", [{ name: "Water", value: 1 }], [{ name: "Wheat", value: 6 }]),
];

function createSektor(): Sektor {
  return new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, { importRestrictions: [], exportRequirements: [] }, []);
}

describe("createBuilding", () => {
  it("creates building on free location", () => {
    const sektor = createSektor();

    const result = sektor.createBuilding({ type: "Mill", location: { x: 8, y: 6 } });

    expect({
      result,
      buildings: sektor.getState().buildings,
    }).toEqual({
      result: {
        error: undefined,
        addedBuildings: [{ type: "Mill", location: { x: 8, y: 6 }, capacity: 0.1 }],
      },
      buildings: [{ type: "Mill", location: { x: 8, y: 6 }, capacity: 0.1 }],
    });
  });

  it("does not create building on occupied location", () => {
    const sektor = createSektor();
    sektor.createBuilding({ type: "Mill", location: { x: 8, y: 6 } });

    const result = sektor.createBuilding({ type: "Well", location: { x: 8, y: 6 } });

    expect({
      result,
      buildings: sektor.getState().buildings,
    }).toEqual({
      result: {
        error: "locationOccupied",
        addedBuildings: [],
      },
      buildings: [{ type: "Mill", location: { x: 8, y: 6 }, capacity: 0.1 }],
    });
  });
});

// A created building starts at capacity 0.1, so it consumes and produces a tenth of the
// amounts in its building function.
describe("createBuilding imports and exports", () => {
  it("adds the created building's inputs to imports and outputs to exports", () => {
    const sektor = createSektor();

    sektor.createBuilding({ type: "Mill", location: { x: 0, y: 0 } });

    expect({
      imports: sektor.getSektorState().imports,
      exports: sektor.getSektorState().exports,
    }).toEqual({
      imports: [{ name: "Wheat", value: 0.4, score: -0.8 }],
      exports: [{ name: "Flour", value: 0.3, score: 0.6 }],
    });
  });

  it("lowers an import when a building producing that resource is created", () => {
    const sektor = createSektor();
    sektor.createBuilding({ type: "Mill", location: { x: 0, y: 0 } });

    sektor.createBuilding({ type: "WheatFarm", location: { x: 1, y: 0 } });

    expect({
      imports: sektor.getSektorState().imports,
      exports: sektor.getSektorState().exports,
    }).toEqual({
      imports: [
        { name: "Wheat", value: 0, score: 0 },
        { name: "Water", value: 0.1, score: -0.2 },
      ],
      exports: [
        { name: "Flour", value: 0.3, score: 0.6 },
        { name: "Wheat", value: 0.2, score: 0.4 },
      ],
    });
  });

  it("lowers an export when a building consuming that resource is created", () => {
    const sektor = createSektor();
    sektor.createBuilding({ type: "WheatFarm", location: { x: 0, y: 0 } });

    sektor.createBuilding({ type: "Well", location: { x: 1, y: 0 } });

    expect({
      imports: sektor.getSektorState().imports,
      exports: sektor.getSektorState().exports,
    }).toEqual({
      imports: [{ name: "Water", value: 0, score: 0 }],
      exports: [
        { name: "Wheat", value: 0.6, score: 1.2 },
        { name: "Water", value: 0, score: 0 },
      ],
    });
  });
});
