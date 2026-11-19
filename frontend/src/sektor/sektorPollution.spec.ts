import { describe, it, expect } from "vitest";
import { Sektor, Location } from "./Sektor";
import { BuildingDefinition } from "./buildings/parseBuildingDefinitions";
import { pollutionFootprint, totalPollution } from "./pollution";

const testDefinitions: BuildingDefinition[] = [
  {
    name: "Grove",
    renderingCodes: ["box s(1,1,1)"],
    buildingFunctions: [{ inputs: [], outputs: [{ name: "Shade", value: 2, affectedByPollution: true }] }],
    properties: {},
  },
  {
    name: "Well",
    renderingCodes: ["box s(1,1,1)"],
    buildingFunctions: [{ inputs: [], outputs: [{ name: "Water", locationProperty: "groundwater" }] }],
    properties: {},
  },
  {
    name: "Home",
    renderingCodes: ["box s(1,1,1)"],
    buildingFunctions: [{ inputs: [], outputs: [{ name: "Joy", value: 4, affectedByPollution: true }] }],
    properties: {},
  },
  {
    name: "Bakery",
    renderingCodes: ["box s(1,1,1)"],
    buildingFunctions: [{ inputs: [], outputs: [{ name: "Bread", value: 2 }] }],
    properties: {},
  },
  {
    name: "Smelter",
    renderingCodes: ["box s(1,1,1)"],
    buildingFunctions: [{ inputs: [], outputs: [{ name: "Iron", value: 1 }] }],
    properties: { pollutionArea: 2 },
  },
];

// A row of locations, every one of them holding plenty of groundwater, fouled as given.
function locationsPolluted(pollutions: number[]): Location[][] {
  return pollutions.map(pollution => [{ properties: { groundwater: 8, pollution } }]);
}

describe("sektor pollution", () => {
  // Two empty squares fouled 40 and 80, a grove fouled 20, a well fouled 20, homes fouled 20 and 60,
  // and a bakery, which pollution does not touch, fouled 50.
  it("is the pollution of every square whose building pollution makes less of what it makes", () => {
    const sektor = new Sektor(locationsPolluted([40, 80, 20, 20, 20, 60, 50]), testDefinitions, []);
    sektor.loadState({
      buildings: [
        { type: "Grove", location: { x: 2, y: 0 } },
        { type: "Well", location: { x: 3, y: 0 } },
        { type: "Home", location: { x: 4, y: 0 } },
        { type: "Home", location: { x: 5, y: 0 } },
        { type: "Bakery", location: { x: 6, y: 0 } },
      ],
    });

    expect(sektor.findPollution()).toEqual(120);
  });

  it("adds up the most every polluting building can foul the ground around it", () => {
    const sektor = new Sektor(locationsPolluted([0, 0, 0]), testDefinitions, []);
    sektor.loadState({
      buildings: [
        { type: "Smelter", location: { x: 0, y: 0 } },
        { type: "Smelter", location: { x: 1, y: 0 } },
        { type: "Bakery", location: { x: 2, y: 0 } },
      ],
    });

    expect(sektor.findPollutionFootprint()).toEqual(2 * pollutionFootprint(2));
  });
});

// The four squares right beside the building are fouled two steps, and the eight a square further
// out one step.
describe("pollutionFootprint", () => {
  it("is every square within the area fouled as much as its distance leaves", () => {
    expect([pollutionFootprint(1), pollutionFootprint(2), pollutionFootprint(3)]).toEqual([80, 320, 800]);
  });
});

describe("totalPollution", () => {
  it("is the pollution of every sektor added up", () => {
    expect([totalPollution([120, 40, 0]), totalPollution([])]).toEqual([160, 0]);
  });
});
