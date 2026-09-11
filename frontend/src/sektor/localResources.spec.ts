import { describe, it, expect } from "vitest";
import { Building, BuildingLocation, Sektor } from "./Sektor";
import { BuildingDefinition } from "./buildings/parseBuildingDefinitions";

// "Care" and "Water" are the local resources of these tests: they can neither be imported nor
// exported.
const LOCAL_RESOURCES = ["Care", "Water"];

const testDefinitions: BuildingDefinition[] = [
  {
    name: "Carer",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{
      inputs: [{ name: "Food", value: 1 }],
      outputs: [{ name: "Care", value: 4 }],
    }],
    outputModifiers: [],
    properties: {},
  },
  {
    name: "Home",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{
      inputs: [{ name: "Care", value: 3 }],
      outputs: [{ name: "Work", value: 5 }],
    }],
    outputModifiers: [],
    properties: {},
  },
  {
    name: "BigHome",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{
      inputs: [{ name: "Care", value: 10 }],
      outputs: [{ name: "Work", value: 20 }],
    }],
    outputModifiers: [],
    properties: {},
  },
  {
    name: "CareChain",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{
      inputs: [{ name: "Care", value: 4 }],
      outputs: [{ name: "Care", value: 6 }],
    }],
    outputModifiers: [],
    properties: {},
  },
  {
    name: "Waterworks",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{
      inputs: [{ name: "Care", value: 4 }],
      outputs: [{ name: "Water", value: 5 }],
    }],
    outputModifiers: [],
    properties: {},
  },
  {
    name: "Washer",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{
      inputs: [{ name: "Water", value: 5 }],
      outputs: [{ name: "Work", value: 2 }],
    }],
    outputModifiers: [],
    properties: {},
  },
];

const SEKTOR_SIZE = 5;

function sektorWithBuildings(buildings: Building[]): Sektor {
  const sektor = new Sektor(
    Array.from({ length: SEKTOR_SIZE }, () => Array.from({ length: SEKTOR_SIZE }, () => ({ properties: {} }))),
    testDefinitions,
    { importRestrictions: [], exportRequirements: [] },
    [],
    LOCAL_RESOURCES,
  );
  sektor.loadState({ buildings });
  return sektor;
}

function throughputs(sektor: Sektor): { imports: { name: string, value: number }[], exports: { name: string, value: number }[] } {
  const sektorState = sektor.getSektorState();
  return {
    imports: sektorState.imports.map(entry => ({ name: entry.name, value: entry.value })),
    exports: sektorState.exports.map(entry => ({ name: entry.name, value: entry.value })),
  };
}

const carerLocation: BuildingLocation = { x: 0, y: 0 };
const homeLocation: BuildingLocation = { x: 1, y: 0 };
const secondHomeLocation: BuildingLocation = { x: 0, y: 1 };
const distantCarerLocation: BuildingLocation = { x: 4, y: 4 };
const distantHomeLocation: BuildingLocation = { x: 3, y: 0 };
const middleHomeLocation: BuildingLocation = { x: 2, y: 2 };
const nearDistantCarerHomeLocation: BuildingLocation = { x: 3, y: 4 };

describe("a local resource is never exported", () => {
  it("leaves the surplus of a local resource out of the exports", () => {
    const sektor = sektorWithBuildings([
      { type: "Carer", location: carerLocation },
      { type: "Home", location: homeLocation },
    ]);

    expect(throughputs(sektor)).toEqual({
      imports: [
        { name: "Food", value: 1 },
        { name: "Care", value: 0 },
      ],
      exports: [{ name: "Work", value: 5 }],
    });
  });

  it("leaves a local resource nothing consumes out of the exports", () => {
    const sektor = sektorWithBuildings([{ type: "Carer", location: carerLocation }]);

    expect(throughputs(sektor)).toEqual({
      imports: [{ name: "Food", value: 1 }],
      exports: [],
    });
  });
});

describe("starving on a local resource", () => {
  it("starves no function while the sektor makes enough of the local resource", () => {
    const sektor = sektorWithBuildings([
      { type: "Carer", location: carerLocation },
      { type: "Home", location: homeLocation },
    ]);

    expect(sektor.getSektorState().starvedFunctions).toEqual([]);
  });

  it("starves a function which the sektor cannot supply with the local resource", () => {
    const sektor = sektorWithBuildings([{ type: "Home", location: homeLocation }]);

    expect(sektor.getSektorState().starvedFunctions).toEqual([
      { buildingLocation: homeLocation, functionIndex: 0 },
    ]);
  });

  it("leaves out the inputs and outputs of a starved function", () => {
    const sektor = sektorWithBuildings([{ type: "Home", location: homeLocation }]);

    expect(throughputs(sektor)).toEqual({
      imports: [],
      exports: [],
    });
  });

  it("starves only as many functions as the shortage needs", () => {
    const sektor = sektorWithBuildings([
      { type: "Carer", location: carerLocation },
      { type: "Home", location: homeLocation },
      { type: "Home", location: secondHomeLocation },
    ]);

    expect({
      starvedFunctions: sektor.getSektorState().starvedFunctions,
      throughputs: throughputs(sektor),
    }).toEqual({
      starvedFunctions: [{ buildingLocation: homeLocation, functionIndex: 0 }],
      throughputs: {
        imports: [
          { name: "Food", value: 1 },
          { name: "Care", value: 0 },
        ],
        exports: [{ name: "Work", value: 5 }],
      },
    });
  });

  it("starves a function whole even when it consumes more than is missing", () => {
    const sektor = sektorWithBuildings([
      { type: "Carer", location: carerLocation },
      { type: "BigHome", location: homeLocation },
    ]);

    expect({
      starvedFunctions: sektor.getSektorState().starvedFunctions,
      throughputs: throughputs(sektor),
    }).toEqual({
      starvedFunctions: [{ buildingLocation: homeLocation, functionIndex: 0 }],
      throughputs: {
        imports: [{ name: "Food", value: 1 }],
        exports: [],
      },
    });
  });

  it("starves the functions left without the local resource a starved function made", () => {
    const sektor = sektorWithBuildings([
      { type: "Waterworks", location: carerLocation },
      { type: "Washer", location: homeLocation },
    ]);

    expect(sektor.getSektorState().starvedFunctions).toEqual([
      { buildingLocation: carerLocation, functionIndex: 0 },
      { buildingLocation: homeLocation, functionIndex: 0 },
    ]);
  });

  it("starves the function farthest from the building making the local resource", () => {
    const sektor = sektorWithBuildings([
      { type: "Carer", location: carerLocation },
      { type: "Home", location: homeLocation },
      { type: "Home", location: distantHomeLocation },
    ]);

    expect(sektor.getSektorState().starvedFunctions).toEqual([
      { buildingLocation: distantHomeLocation, functionIndex: 0 },
    ]);
  });

  it("measures the distance to the nearest of the buildings making the local resource", () => {
    const sektor = sektorWithBuildings([
      { type: "Carer", location: carerLocation },
      { type: "Carer", location: distantCarerLocation },
      { type: "Home", location: nearDistantCarerHomeLocation },
      { type: "Home", location: middleHomeLocation },
      { type: "Home", location: homeLocation },
    ]);

    expect(sektor.getSektorState().starvedFunctions).toEqual([
      { buildingLocation: middleHomeLocation, functionIndex: 0 },
    ]);
  });

  it("starves a function making the local resource itself only after all the others", () => {
    const sektor = sektorWithBuildings([
      { type: "CareChain", location: carerLocation },
      { type: "Home", location: homeLocation },
    ]);

    expect(sektor.getSektorState().starvedFunctions).toEqual([
      { buildingLocation: homeLocation, functionIndex: 0 },
    ]);
  });

  it("reports a starved function in the state of its building", () => {
    const sektor = sektorWithBuildings([{ type: "Home", location: homeLocation }]);

    expect(sektor.getBuildingState(homeLocation)!.buildingFunctions.map(functionState => functionState.starved))
      .toEqual([true]);
  });
});
