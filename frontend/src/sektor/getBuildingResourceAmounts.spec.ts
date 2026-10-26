import { describe, it, expect } from "vitest";
import { Sektor } from "./Sektor";
import { BuildingDefinition } from "./buildings/parseBuildingDefinitions";

const testDefinitions: BuildingDefinition[] = [
  {
    name: "Farm",
    renderingCodes: ["box s(1,1,1)"],
    buildingFunctions: [{
      inputs: [],
      outputs: [{ name: "Wheat", value: 4 }],
    }],
    properties: {},
  },
  {
    name: "Mill",
    renderingCodes: ["box s(1,1,1)"],
    buildingFunctions: [{
      inputs: [{ name: "Wheat", value: 4 }],
      outputs: [{ name: "Flour", value: 3 }],
    }],
    properties: {},
  },
  {
    name: "SolarFarm",
    renderingCodes: ["box s(1,1,1)"],
    buildingFunctions: [{
      inputs: [],
      outputs: [{ name: "Energy", locationProperty: "insolation" }],
    }],
    properties: {},
  },
  {
    name: "Clinic",
    renderingCodes: ["box s(1,1,1)"],
    buildingFunctions: [{
      inputs: [{ name: "Wheat", value: 1 }, { name: "Care", value: 2 }],
      outputs: [{ name: "Health", value: 1 }],
    }],
    properties: {},
  },
  {
    name: "Bakery",
    renderingCodes: ["box s(1,1,1)"],
    buildingFunctions: [{
      inputs: [{ name: "Wheat", value: 2 }, { name: "Sugar", value: 1 }],
      outputs: [{ name: "Cake", value: 1 }],
    }],
    properties: {},
  },
];

const farmLocation = { x: 0, y: 0 };
const otherLocation = { x: 0, y: 1 };

function createSektor(): Sektor {
  return new Sektor([[{ properties: { insolation: 0 } }, { properties: { insolation: 0 } }]], testDefinitions, ["Care"]);
}

describe("getBuildingResourceAmounts", () => {
  it("tells what every building takes in and gives out of the resource", () => {
    const sektor = createSektor();
    sektor.createBuilding({ type: "Farm", location: farmLocation });
    sektor.createBuilding({ type: "Mill", location: otherLocation });

    expect(sektor.getBuildingResourceAmounts("Wheat", true)).toEqual([
      { location: farmLocation, inputAmount: 0, outputAmount: 4 },
      { location: otherLocation, inputAmount: 4, outputAmount: 0 },
    ]);
  });

  it("tells nothing given out by an output of a location with none of the property it is named after", () => {
    const sektor = createSektor();
    sektor.createBuilding({ type: "SolarFarm", location: farmLocation });

    expect(sektor.getBuildingResourceAmounts("Energy", true)).toEqual([
      { location: farmLocation, inputAmount: 0, outputAmount: 0 },
    ]);
  });

  it("tells nothing taken in by a function starved of a local resource", () => {
    const sektor = createSektor();
    sektor.createBuilding({ type: "Farm", location: farmLocation });
    sektor.createBuilding({ type: "Clinic", location: otherLocation });

    expect(sektor.getBuildingResourceAmounts("Wheat", true)).toEqual([
      { location: farmLocation, inputAmount: 0, outputAmount: 4 },
      { location: otherLocation, inputAmount: 0, outputAmount: 0 },
    ]);
  });

  it("tells what a function starved of a local resource would take in, when told of more than what runs", () => {
    const sektor = createSektor();
    sektor.createBuilding({ type: "Farm", location: farmLocation });
    sektor.createBuilding({ type: "Clinic", location: otherLocation });

    expect(sektor.getBuildingResourceAmounts("Wheat", false)).toEqual([
      { location: farmLocation, inputAmount: 0, outputAmount: 4 },
      { location: otherLocation, inputAmount: 1, outputAmount: 0 },
    ]);
  });

  it("tells nothing taken in by a building disabled for want of imports", () => {
    const sektor = createSektor();
    sektor.createBuilding({ type: "Farm", location: farmLocation });
    sektor.createBuilding({ type: "Bakery", location: otherLocation });

    expect(sektor.getBuildingResourceAmounts("Wheat", true)).toEqual([
      { location: farmLocation, inputAmount: 0, outputAmount: 4 },
      { location: otherLocation, inputAmount: 0, outputAmount: 0 },
    ]);
  });
});
