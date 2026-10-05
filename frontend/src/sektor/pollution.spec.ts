import { describe, it, expect } from "vitest";
import { Sektor, Location } from "./Sektor";
import { BuildingDefinition } from "./buildings/parseBuildingDefinitions";

const testDefinitions: BuildingDefinition[] = [
  {
    name: "Smokestack",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [],
    properties: { pollutionArea: 3 },
  },
  {
    name: "Chimney",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [],
    properties: { pollutionArea: 1 },
  },
  {
    name: "Bakery",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [],
    properties: {},
  },
];

// A clean map of seven squares by seven, so that a Smokestack in its middle fouls ground reaching
// right up to its edges.
const MIDDLE = { x: 3, y: 3 };

function cleanLocations(): Location[][] {
  return Array.from({ length: 7 }, () => Array.from({ length: 7 }, () => ({ properties: { pollution: 0 } })));
}

function createSektor(locations: Location[][] = cleanLocations()): Sektor {
  return new Sektor(locations, testDefinitions, []);
}

function pollutionOf(sektor: Sektor): number[][] {
  return sektor.getLocations().map(row => row.map(location => location.properties.pollution));
}

describe("pollution", () => {
  it("fouls the ground around a polluting building, the most right beside it", () => {
    const sektor = createSektor();

    sektor.createBuilding({ type: "Smokestack", location: MIDDLE });

    expect(pollutionOf(sektor)).toEqual([
      [0, 0, 0, 20, 0, 0, 0],
      [0, 0, 20, 40, 20, 0, 0],
      [0, 20, 40, 60, 40, 20, 0],
      [20, 40, 60, 0, 60, 40, 20],
      [0, 20, 40, 60, 40, 20, 0],
      [0, 0, 20, 40, 20, 0, 0],
      [0, 0, 0, 20, 0, 0, 0],
    ]);
  });

  it("adds up the pollution of polluting buildings whose areas overlap", () => {
    const sektor = createSektor();

    sektor.createBuilding({ type: "Chimney", location: { x: 0, y: 0 } });
    sektor.createBuilding({ type: "Chimney", location: { x: 0, y: 2 } });

    expect(pollutionOf(sektor)[0].slice(0, 4)).toEqual([0, 40, 0, 20]);
  });

  // Two Smokestacks right beside the same square would put 60 on it each.
  it("never fouls a location more than all the way", () => {
    const sektor = createSektor();

    sektor.createBuilding({ type: "Smokestack", location: { x: 3, y: 2 } });
    sektor.createBuilding({ type: "Smokestack", location: { x: 3, y: 4 } });

    expect(pollutionOf(sektor)[3][3]).toEqual(100);
  });

  it("leaves the ground as it was when a building which pollutes nothing is built", () => {
    const sektor = createSektor();

    sektor.createBuilding({ type: "Bakery", location: MIDDLE });

    expect(pollutionOf(sektor)).toEqual(pollutionOf(createSektor()));
  });

  it("takes away the pollution a polluting building put there when it is destroyed", () => {
    const sektor = createSektor();
    sektor.createBuilding({ type: "Chimney", location: { x: 0, y: 0 } });
    sektor.createBuilding({ type: "Chimney", location: { x: 0, y: 2 } });

    sektor.destroyBuilding({ x: 0, y: 0 });

    expect(pollutionOf(sektor)[0].slice(0, 4)).toEqual([0, 20, 0, 20]);
  });

  // The pollution was capped at 100 while both stood, yet taking one down leaves exactly what the
  // other one puts there.
  it("leaves the pollution of the remaining building when one of two fouling a location more than all the way is destroyed", () => {
    const sektor = createSektor();
    sektor.createBuilding({ type: "Smokestack", location: { x: 3, y: 2 } });
    sektor.createBuilding({ type: "Smokestack", location: { x: 3, y: 4 } });

    sektor.destroyBuilding({ x: 3, y: 4 });

    expect(pollutionOf(sektor)[3][3]).toEqual(60);
  });

  // A sektor saved with a polluting building in it was saved with the ground that building fouled,
  // so loading it does not foul the ground all over again.
  it("keeps the pollution a sektor was loaded with", () => {
    const locations = cleanLocations();
    locations[3][4].properties.pollution = 60;
    const sektor = createSektor(locations);

    sektor.loadState({ buildings: [{ type: "Smokestack", location: MIDDLE }] });

    expect(pollutionOf(sektor)[3][4]).toEqual(60);
  });
});
