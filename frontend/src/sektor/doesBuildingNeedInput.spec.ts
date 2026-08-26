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
];

function createSektor(): Sektor {
  return new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, { importRestrictions: [], exportRequirements: [] }, []);
}

describe("doesBuildingNeedInput", () => {
  it("returns true when the building has an input of the resource", () => {
    const sektor = createSektor();
    sektor.createBuilding({ type: "Mill", location: { x: 0, y: 0 } });

    expect(sektor.doesBuildingNeedInput({ x: 0, y: 0 }, "Wheat")).toEqual(true);
  });

  it("returns false when the building has no input of the resource", () => {
    const sektor = createSektor();
    sektor.createBuilding({ type: "Mill", location: { x: 0, y: 0 } });

    expect(sektor.doesBuildingNeedInput({ x: 0, y: 0 }, "Flour")).toEqual(false);
  });

  it("returns false when there is no building at the location", () => {
    const sektor = createSektor();

    expect(sektor.doesBuildingNeedInput({ x: 0, y: 0 }, "Wheat")).toEqual(false);
  });
});
