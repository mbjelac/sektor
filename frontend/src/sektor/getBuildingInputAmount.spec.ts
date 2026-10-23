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
];

function createSektor(): Sektor {
  return new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, []);
}

describe("getBuildingInputAmount", () => {
  it("returns the amount the building takes in of the resource", () => {
    const sektor = createSektor();
    sektor.createBuilding({ type: "Mill", location: { x: 0, y: 0 } });

    expect(sektor.getBuildingInputAmount({ x: 0, y: 0 }, "Wheat")).toEqual(4);
  });

  it("returns zero when the building has no input of the resource", () => {
    const sektor = createSektor();
    sektor.createBuilding({ type: "Mill", location: { x: 0, y: 0 } });

    expect(sektor.getBuildingInputAmount({ x: 0, y: 0 }, "Flour")).toEqual(0);
  });

  it("returns zero when there is no building at the location", () => {
    const sektor = createSektor();

    expect(sektor.getBuildingInputAmount({ x: 0, y: 0 }, "Wheat")).toEqual(0);
  });
});
