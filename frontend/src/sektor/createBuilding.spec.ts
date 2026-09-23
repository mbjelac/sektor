import { describe, it, expect } from "vitest";
import { Sektor } from "./Sektor";
import { BuildingDefinition } from "./buildings/parseBuildingDefinitions";
import { GROUND, SEA } from "../../../shared/terrain";

function buildingDefinition(name: string, inputs: { name: string, value: number }[], outputs: { name: string, value: number }[]): BuildingDefinition {
  return {
    name,
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{ inputs, outputs }],
    properties: {},
  };
}

const testDefinitions: BuildingDefinition[] = [
  buildingDefinition("Mill", [{ name: "Wheat", value: 4 }], [{ name: "Flour", value: 3 }]),
  buildingDefinition("Well", [], [{ name: "Water", value: 1 }]),
  buildingDefinition("WheatFarm", [{ name: "Water", value: 1 }], [{ name: "Wheat", value: 6 }]),
];

function createSektor(): Sektor {
  return new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, []);
}

// A sektor whose map is dry land but for the one square of sea, so that a test can build on the
// water and on the ground beside it.
const SEA_LOCATION = { x: 1, y: 0 };
const GROUND_LOCATION = { x: 0, y: 0 };

function createSektorWithSea(): Sektor {
  return new Sektor(
    [[{ properties: { soil: 1.0 } }]],
    testDefinitions,
    [],
    [[GROUND], [SEA]],
  );
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
        addedBuildings: [{ type: "Mill", location: { x: 8, y: 6 } }],
      },
      buildings: [{ type: "Mill", location: { x: 8, y: 6 } }],
    });
  });

  it("does not create a building on a square of sea", () => {
    const sektor = createSektorWithSea();

    const result = sektor.createBuilding({ type: "Mill", location: SEA_LOCATION });

    expect({
      result,
      buildings: sektor.getState().buildings,
    }).toEqual({
      result: {
        error: "notDryEnough",
        addedBuildings: [],
      },
      buildings: [],
    });
  });

  it("creates a building on dry land of a sektor which has sea in it", () => {
    const sektor = createSektorWithSea();

    const result = sektor.createBuilding({ type: "Mill", location: GROUND_LOCATION });

    expect({
      result,
      buildings: sektor.getState().buildings,
    }).toEqual({
      result: {
        error: undefined,
        addedBuildings: [{ type: "Mill", location: GROUND_LOCATION }],
      },
      buildings: [{ type: "Mill", location: GROUND_LOCATION }],
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
      buildings: [{ type: "Mill", location: { x: 8, y: 6 } }],
    });
  });
});

describe("createBuilding imports and exports", () => {
  it("adds the created building's inputs to imports and outputs to exports", () => {
    const sektor = createSektor();

    sektor.createBuilding({ type: "Mill", location: { x: 0, y: 0 } });

    expect({
      imports: sektor.getSektorState().imports,
      exports: sektor.getSektorState().exports,
    }).toEqual({
      imports: [{ name: "Wheat", value: 4 }],
      exports: [{ name: "Flour", value: 3 }],
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
        { name: "Wheat", value: 0 },
        { name: "Water", value: 1 },
      ],
      exports: [
        { name: "Flour", value: 3 },
        { name: "Wheat", value: 2 },
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
      imports: [{ name: "Water", value: 0 }],
      exports: [
        { name: "Wheat", value: 6 },
        { name: "Water", value: 0 },
      ],
    });
  });
});
