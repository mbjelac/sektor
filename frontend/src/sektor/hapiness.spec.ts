import { describe, it, expect } from "vitest";
import { Building, Sektor } from "./Sektor";
import { BuildingDefinition } from "./buildings/parseBuildingDefinitions";

// The local resources of these tests, neither of which can be brought in or sent out: a habitat has
// to be given its Cheer by something standing in the same sektor, and the Hapiness it makes of it
// stays there too.
const LOCAL_RESOURCES = ["Cheer", "Hapiness"];

const testDefinitions: BuildingDefinition[] = [
  {
    name: "Habitat",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{
      inputs: [{ name: "Cheer", value: 2 }],
      outputs: [{ name: "Hapiness", value: 5 }],
    }],
    properties: {},
  },
  {
    name: "CheerWorks",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{
      inputs: [],
      outputs: [{ name: "Cheer", value: 4 }],
    }],
    properties: {},
  },
  {
    name: "SmallCheerWorks",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{
      inputs: [],
      outputs: [{ name: "Cheer", value: 2 }],
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
];

const SEKTOR_SIZE = 5;

function sektorWithBuildings(buildings: Building[]): Sektor {
  const sektor = new Sektor(
    Array.from({ length: SEKTOR_SIZE }, () => Array.from({ length: SEKTOR_SIZE }, () => ({ properties: {} }))),
    testDefinitions,
    LOCAL_RESOURCES,
  );
  sektor.loadState({ buildings });
  return sektor;
}

describe("hapiness", () => {
  it("stands at nothing in a sektor with nothing making it", () => {
    const sektor = sektorWithBuildings([{ type: "Well", location: { x: 0, y: 0 } }]);

    expect(sektor.getSektorState().hapiness).toEqual(0);
  });

  it("stands at nothing in a sektor with nothing in it at all", () => {
    expect(sektorWithBuildings([]).getSektorState().hapiness).toEqual(0);
  });

  it("adds up what every habitat makes while each is given all the Cheer it asks for", () => {
    const sektor = sektorWithBuildings([
      { type: "CheerWorks", location: { x: 0, y: 0 } },
      { type: "Habitat", location: { x: 1, y: 0 } },
      { type: "Habitat", location: { x: 2, y: 0 } },
    ]);

    expect(sektor.getSektorState().hapiness).toEqual(10);
  });

  // The works makes two Cheer where four are asked for, so one habitat goes without and makes
  // nothing of its people at all.
  it("counts nothing from a habitat left without the Cheer it asks for", () => {
    const sektor = sektorWithBuildings([
      { type: "Habitat", location: { x: 0, y: 0 } },
      { type: "Habitat", location: { x: 1, y: 0 } },
    ]);

    expect(sektor.getSektorState().hapiness).toEqual(0);
  });

  it("counts only what the habitats given their Cheer make", () => {
    const sektor = sektorWithBuildings([
      { type: "SmallCheerWorks", location: { x: 0, y: 0 } },
      { type: "Habitat", location: { x: 1, y: 0 } },
      { type: "Habitat", location: { x: 2, y: 0 } },
    ]);

    expect(sektor.getSektorState().hapiness).toEqual(5);
  });

  // Hapiness is local, so none of it leaves the sektor however much of it is made: it is counted
  // where it is made and nowhere else.
  it("sends none of it out of the sektor", () => {
    const sektor = sektorWithBuildings([
      { type: "CheerWorks", location: { x: 0, y: 0 } },
      { type: "Habitat", location: { x: 1, y: 0 } },
    ]);

    const sektorState = sektor.getSektorState();

    expect({ hapiness: sektorState.hapiness, exports: sektorState.exports.map(throughput => throughput.name) })
      .toEqual({ hapiness: 5, exports: [] });
  });
});
