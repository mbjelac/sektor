import { describe, it, expect } from "vitest";
import { Sektor, Location } from "./Sektor";
import { BuildingDefinition } from "./buildings/parseBuildingDefinitions";

const testDefinitions: BuildingDefinition[] = [
  {
    name: "Farm",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{ inputs: [], outputs: [{ name: "Wheat", locationProperty: "soil" }] }],
    properties: {},
  },
  {
    name: "Well",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{ inputs: [], outputs: [{ name: "Water", locationProperty: "groundwater" }] }],
    properties: {},
  },
  {
    name: "Windmill",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{ inputs: [], outputs: [{ name: "Energy", locationProperty: "wind" }] }],
    properties: {},
  },
  {
    name: "Bakery",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{ inputs: [], outputs: [{ name: "Bread", value: 2 }] }],
    properties: {},
  },
  {
    name: "Orchard",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [
      { inputs: [], outputs: [{ name: "Wood", value: 1 }] },
      { inputs: [], outputs: [{ name: "Apples", locationProperty: "soil" }] },
    ],
    properties: {},
  },
];

// A row of locations, every one of them holding plenty of every property, fouled as given.
function locationsPolluted(pollutions: number[]): Location[][] {
  return pollutions.map(pollution => [{ properties: { soil: 8, groundwater: 8, wind: 8, pollution } }]);
}

describe("buildings with output decreased by pollution", () => {
  it("are those drawing what they make out of soil or groundwater on polluted ground", () => {
    const sektor = new Sektor(locationsPolluted([20, 20, 0, 20, 20]), testDefinitions, []);
    sektor.loadState({
      buildings: [
        { type: "Farm", location: { x: 0, y: 0 } },
        { type: "Well", location: { x: 1, y: 0 } },
        { type: "Farm", location: { x: 2, y: 0 } },
        { type: "Windmill", location: { x: 3, y: 0 } },
        { type: "Bakery", location: { x: 4, y: 0 } },
      ],
    });

    expect(sektor.findBuildingsWithOutputDecreasedByPollution()).toEqual([{ x: 0, y: 0 }, { x: 1, y: 0 }]);
  });

  // The Orchard grows its apples only once its second function is switched on.
  it("leave out a building whose function drawing on soil is switched off", () => {
    const sektor = new Sektor(locationsPolluted([20]), testDefinitions, []);
    sektor.loadState({ buildings: [{ type: "Orchard", location: { x: 0, y: 0 } }] });

    expect(sektor.isOutputDecreasedByPollution({ x: 0, y: 0 })).toEqual(false);
  });

  it("include a building once its function drawing on soil is switched on", () => {
    const sektor = new Sektor(locationsPolluted([20]), testDefinitions, []);
    sektor.loadState({ buildings: [{ type: "Orchard", location: { x: 0, y: 0 } }] });

    sektor.activateFunction({ x: 0, y: 0 }, 1);

    expect(sektor.isOutputDecreasedByPollution({ x: 0, y: 0 })).toEqual(true);
  });
});
