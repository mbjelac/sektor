import { describe, it, expect } from "vitest";
import { Sektor } from "./Sektor";
import { BuildingDefinition } from "./buildings/parseBuildingDefinitions";

const testDefinitions: BuildingDefinition[] = [
  {
    name: "Mill",
    renderingCode: "box s(1,1,1)",
    buildingFunction: {
      inputs: [{ name: "Wheat", value: 4 }],
      outputs: [{ name: "Flour", value: 3 }],
    },
    outputModifiers: [],
    properties: {},
  },
  {
    name: "SolarFarm",
    renderingCode: "box s(1,1,1)",
    buildingFunction: {
      inputs: [],
      outputs: [{ name: "Energy", value: 4 }],
    },
    outputModifiers: [{ resource: "Energy", property: "insolation" }],
    properties: {},
  },
];

function createSektor(): Sektor {
  return new Sektor([[{ properties: { insolation: -4 } }]], testDefinitions, { importRestrictions: [], exportRequirements: [] }, []);
}

describe("doesBuildingHaveOutput", () => {
  it("returns true when the building has an output of the resource", () => {
    const sektor = createSektor();
    sektor.createBuilding({ type: "Mill", location: { x: 0, y: 0 } });

    expect(sektor.doesBuildingHaveOutput({ x: 0, y: 0 }, "Flour")).toEqual(true);
  });

  it("returns false when the building has no output of the resource", () => {
    const sektor = createSektor();
    sektor.createBuilding({ type: "Mill", location: { x: 0, y: 0 } });

    expect(sektor.doesBuildingHaveOutput({ x: 0, y: 0 }, "Wheat")).toEqual(false);
  });

  it("returns false when location properties reduce the output to zero", () => {
    const sektor = createSektor();
    sektor.createBuilding({ type: "SolarFarm", location: { x: 0, y: 0 } });

    expect(sektor.doesBuildingHaveOutput({ x: 0, y: 0 }, "Energy")).toEqual(false);
  });

  it("returns false when there is no building at the location", () => {
    const sektor = createSektor();

    expect(sektor.doesBuildingHaveOutput({ x: 0, y: 0 }, "Flour")).toEqual(false);
  });
});
