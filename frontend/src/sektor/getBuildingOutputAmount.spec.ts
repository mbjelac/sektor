import { describe, it, expect } from "vitest";
import { Sektor } from "./Sektor";
import { BuildingDefinition } from "./buildings/parseBuildingDefinitions";

const testDefinitions: BuildingDefinition[] = [
  {
    name: "Mill",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{
      inputs: [{ name: "Wheat", value: 4 }],
      outputs: [{ name: "Flour", value: 3 }],
    }],
    properties: {},
  },
  {
    name: "SolarFarm",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{
      inputs: [],
      outputs: [{ name: "Energy", locationProperty: "insolation" }],
    }],
    properties: {},
  },
];

function createSektor(): Sektor {
  return new Sektor([[{ properties: { insolation: 0 } }]], testDefinitions, []);
}

describe("getBuildingOutputAmount", () => {
  it("returns the amount the building puts out of the resource", () => {
    const sektor = createSektor();
    sektor.createBuilding({ type: "Mill", location: { x: 0, y: 0 } });

    expect(sektor.getBuildingOutputAmount({ x: 0, y: 0 }, "Flour")).toEqual(3);
  });

  it("returns zero when the building has no output of the resource", () => {
    const sektor = createSektor();
    sektor.createBuilding({ type: "Mill", location: { x: 0, y: 0 } });

    expect(sektor.getBuildingOutputAmount({ x: 0, y: 0 }, "Wheat")).toEqual(0);
  });

  it("returns zero when the location has nothing of the property the output is named after", () => {
    const sektor = createSektor();
    sektor.createBuilding({ type: "SolarFarm", location: { x: 0, y: 0 } });

    expect(sektor.getBuildingOutputAmount({ x: 0, y: 0 }, "Energy")).toEqual(0);
  });

  it("returns zero when there is no building at the location", () => {
    const sektor = createSektor();

    expect(sektor.getBuildingOutputAmount({ x: 0, y: 0 }, "Flour")).toEqual(0);
  });
});
