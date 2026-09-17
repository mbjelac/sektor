import { describe, it, expect } from "vitest";
import { Sektor } from "./Sektor";
import { BuildingDefinition } from "./buildings/parseBuildingDefinitions";

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
  return new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, { importRestrictions: [], exportRequirements: [] }, [], []);
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

  // A building definition which names the highest ground it may stand on: the Chalet goes no
  // higher than the second step up, and the Well says nothing, so the Well goes anywhere.
  it("creates a building on ground no higher than the building allows", () => {
    const sektor = createSektorOnAHillside();

    const result = sektor.createBuilding({ type: "Chalet", location: { x: 0, y: 2 } });

    expect({ result, buildings: sektor.getState().buildings }).toEqual({
      result: { error: undefined, addedBuildings: [{ type: "Chalet", location: { x: 0, y: 2 } }] },
      buildings: [{ type: "Chalet", location: { x: 0, y: 2 } }],
    });
  });

  it("does not create a building on ground higher than the building allows", () => {
    const sektor = createSektorOnAHillside();

    const result = sektor.createBuilding({ type: "Chalet", location: { x: 0, y: 3 } });

    expect({ result, buildings: sektor.getState().buildings }).toEqual({
      result: { error: "altitudeTooHigh", addedBuildings: [] },
      buildings: [],
    });
  });

  it("creates a building which names no highest ground on the highest ground there is", () => {
    const sektor = createSektorOnAHillside();

    const result = sektor.createBuilding({ type: "Well", location: { x: 0, y: 4 } });

    expect({ result, buildings: sektor.getState().buildings }).toEqual({
      result: { error: undefined, addedBuildings: [{ type: "Well", location: { x: 0, y: 4 } }] },
      buildings: [{ type: "Well", location: { x: 0, y: 4 } }],
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

// One row of ground climbing from the flat into the hills, so that a location of every altitude
// can be built on.
function createSektorOnAHillside(): Sektor {
  const hillside = [[0, 1, 2, 3, 4].map(altitude => ({ properties: { soil: 1.0, altitude } }))];
  return new Sektor(
    hillside,
    [...testDefinitions, chaletDefinition],
    { importRestrictions: [], exportRequirements: [] },
    [],
    [],
  );
}

const chaletDefinition: BuildingDefinition = {
  ...buildingDefinition("Chalet", [], [{ name: "Rest", value: 1 }]),
  properties: { maxAltitude: 2 },
};

describe("createBuilding imports and exports", () => {
  it("adds the created building's inputs to imports and outputs to exports", () => {
    const sektor = createSektor();

    sektor.createBuilding({ type: "Mill", location: { x: 0, y: 0 } });

    expect({
      imports: sektor.getSektorState().imports,
      exports: sektor.getSektorState().exports,
    }).toEqual({
      imports: [{ name: "Wheat", value: 4, score: -8 }],
      exports: [{ name: "Flour", value: 3, score: 6 }],
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
        { name: "Water", value: 1, score: -2 },
      ],
      exports: [
        { name: "Flour", value: 3, score: 6 },
        { name: "Wheat", value: 2, score: 4 },
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
        { name: "Wheat", value: 6, score: 12 },
        { name: "Water", value: 0, score: 0 },
      ],
    });
  });
});
