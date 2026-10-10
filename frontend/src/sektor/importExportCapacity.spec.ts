import { describe, it, expect } from "vitest";
import { Building, BuildingLocation, IMPORT_EXPORT_RESOURCE, Sektor } from "./Sektor";
import { BuildingDefinition } from "./buildings/parseBuildingDefinitions";

// Every Mill imports 3 Wheat, so it needs 3 of a hub's import capacity to run. Its 1 Flour is an
// export, which never keeps it from running.
const testDefinitions: BuildingDefinition[] = [
  {
    name: "Hub",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{
      inputs: [],
      outputs: [{ name: IMPORT_EXPORT_RESOURCE, value: 4 }],
    }],
    properties: {},
  },
  {
    name: "Well",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{
      inputs: [],
      outputs: [{ name: "Water", value: 1 }],
    }],
    properties: {},
  },
  {
    name: "Quarry",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{
      inputs: [],
      outputs: [{ name: "Stone", value: 6 }],
    }],
    properties: {},
  },
  {
    name: "Mine",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{
      inputs: [],
      outputs: [{ name: "Ore", value: 4 }],
    }],
    properties: {},
  },
  {
    name: "Mill",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{
      inputs: [{ name: "Wheat", value: 3 }],
      outputs: [{ name: "Flour", value: 1 }],
    }],
    properties: {},
  },
];

const SEKTOR_SIZE = 5;

function sektorWithBuildings(buildings: Building[]): Sektor {
  const sektor = new Sektor(
    Array.from({ length: SEKTOR_SIZE }, () => Array.from({ length: SEKTOR_SIZE }, () => ({ properties: {} }))),
    testDefinitions,
    [IMPORT_EXPORT_RESOURCE],
  );
  sektor.loadState({ buildings });
  return sektor;
}

function importsExportsAndDisabledBuildings(sektor: Sektor): {
  imports: { name: string, value: number }[],
  exports: { name: string, value: number }[],
  disabledBuildings: BuildingLocation[],
  croppedExports: string[],
} {
  const sektorState = sektor.getSektorState();
  return {
    imports: sektorState.imports,
    exports: sektorState.exports,
    disabledBuildings: sektorState.disabledBuildings,
    croppedExports: sektorState.croppedExports,
  };
}

const hubLocation: BuildingLocation = { x: 0, y: 0 };
const otherHubLocation: BuildingLocation = { x: 4, y: 4 };
const nearMillLocation: BuildingLocation = { x: 1, y: 0 };
const farMillLocation: BuildingLocation = { x: 4, y: 3 };
const middleMillLocation: BuildingLocation = { x: 2, y: 2 };
const wellLocation: BuildingLocation = { x: 3, y: 3 };
const quarryLocation: BuildingLocation = { x: 3, y: 0 };
const mineLocation: BuildingLocation = { x: 0, y: 3 };

describe("a sektor without a hub", () => {
  it("disables every importing building, in the order they were built", () => {
    const sektor = sektorWithBuildings([
      { type: "Mill", location: farMillLocation },
      { type: "Mill", location: nearMillLocation },
    ]);

    expect(importsExportsAndDisabledBuildings(sektor)).toEqual({
      imports: [],
      exports: [],
      disabledBuildings: [farMillLocation, nearMillLocation],
      croppedExports: [],
    });
  });

  it("wastes every export", () => {
    const sektor = sektorWithBuildings([
      { type: "Well", location: wellLocation },
    ]);

    expect(importsExportsAndDisabledBuildings(sektor)).toEqual({
      imports: [],
      exports: [{ name: "Water", value: 0 }],
      disabledBuildings: [],
      croppedExports: ["Water"],
    });
  });
});

describe("a building consuming nothing", () => {
  it("is never disabled, as it needs nothing brought in", () => {
    const sektor = sektorWithBuildings([
      { type: "Well", location: wellLocation },
      { type: "Mill", location: nearMillLocation },
    ]);

    expect(importsExportsAndDisabledBuildings(sektor)).toEqual({
      imports: [],
      exports: [{ name: "Water", value: 0 }],
      disabledBuildings: [nearMillLocation],
      croppedExports: ["Water"],
    });
  });
});

describe("a sektor with hubs", () => {
  it("disables and wastes nothing while its imports and its exports each fit through its hubs", () => {
    const sektor = sektorWithBuildings([
      { type: "Hub", location: hubLocation },
      { type: "Mill", location: nearMillLocation },
    ]);

    expect(importsExportsAndDisabledBuildings(sektor)).toEqual({
      imports: [{ name: "Wheat", value: 3 }],
      exports: [{ name: "Flour", value: 1 }],
      disabledBuildings: [],
      croppedExports: [],
    });
  });

  it("disables the building farthest from the hub, until imports fit through it", () => {
    const sektor = sektorWithBuildings([
      { type: "Hub", location: hubLocation },
      { type: "Mill", location: nearMillLocation },
      { type: "Mill", location: farMillLocation },
      { type: "Mill", location: middleMillLocation },
    ]);

    expect(importsExportsAndDisabledBuildings(sektor)).toEqual({
      imports: [{ name: "Wheat", value: 3 }],
      exports: [{ name: "Flour", value: 1 }],
      disabledBuildings: [farMillLocation, middleMillLocation],
      croppedExports: [],
    });
  });

  it("measures the distance to the nearest hub and adds up the capacity of all hubs", () => {
    const sektor = sektorWithBuildings([
      { type: "Hub", location: hubLocation },
      { type: "Hub", location: otherHubLocation },
      { type: "Mill", location: nearMillLocation },
      { type: "Mill", location: farMillLocation },
      { type: "Mill", location: middleMillLocation },
    ]);

    expect(importsExportsAndDisabledBuildings(sektor)).toEqual({
      imports: [{ name: "Wheat", value: 6 }],
      exports: [{ name: "Flour", value: 2 }],
      disabledBuildings: [middleMillLocation],
      croppedExports: [],
    });
  });

  it("disables nothing for exports, however far beyond its hubs they go", () => {
    const sektor = sektorWithBuildings([
      { type: "Hub", location: hubLocation },
      { type: "Mill", location: nearMillLocation },
      { type: "Quarry", location: quarryLocation },
    ]);

    expect(importsExportsAndDisabledBuildings(sektor)).toEqual({
      imports: [{ name: "Wheat", value: 3 }],
      exports: [{ name: "Flour", value: 0 }, { name: "Stone", value: 4 }],
      disabledBuildings: [],
      croppedExports: ["Flour", "Stone"],
    });
  });

  it("takes an equal amount from every export, until exports fit through its hubs", () => {
    const sektor = sektorWithBuildings([
      { type: "Hub", location: hubLocation },
      { type: "Quarry", location: quarryLocation },
      { type: "Mine", location: mineLocation },
    ]);

    expect(importsExportsAndDisabledBuildings(sektor)).toEqual({
      imports: [],
      exports: [{ name: "Stone", value: 3 }, { name: "Ore", value: 1 }],
      disabledBuildings: [],
      croppedExports: ["Stone", "Ore"],
    });
  });

  it("takes what an export runs out of equally from the exports left", () => {
    const sektor = sektorWithBuildings([
      { type: "Hub", location: hubLocation },
      { type: "Quarry", location: quarryLocation },
      { type: "Well", location: wellLocation },
    ]);

    expect(importsExportsAndDisabledBuildings(sektor)).toEqual({
      imports: [],
      exports: [{ name: "Stone", value: 4 }, { name: "Water", value: 0 }],
      disabledBuildings: [],
      croppedExports: ["Stone", "Water"],
    });
  });
});

describe("a disabled building", () => {
  it("is told apart from a running one by its building state", () => {
    const sektor = sektorWithBuildings([
      { type: "Hub", location: hubLocation },
      { type: "Mill", location: nearMillLocation },
      { type: "Mill", location: farMillLocation },
    ]);

    expect({
      nearMill: sektor.getBuildingState(nearMillLocation)!.disabled,
      farMill: sektor.getBuildingState(farMillLocation)!.disabled,
    }).toEqual({
      nearMill: false,
      farMill: true,
    });
  });
});
