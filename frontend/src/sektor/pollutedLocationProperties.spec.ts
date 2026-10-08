import { describe, it, expect } from "vitest";
import { IMPORT_EXPORT_RESOURCE, Sektor } from "./Sektor";
import { TEST_HUB, TEST_HUB_DEFINITION } from "./testImportExportHub";
import { BuildingDefinition } from "./buildings/parseBuildingDefinitions";
import { pollutedLocationProperties } from "./pollution";

const testDefinitions: BuildingDefinition[] = [
  {
    name: "Farm",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{
      inputs: [],
      outputs: [{ name: "Wheat", locationProperty: "soil" }],
    }],
    properties: {},
  },
];

describe("pollutedLocationProperties", () => {
  it("leaves only the unpolluted part of soil and groundwater", () => {
    const locationProperties = pollutedLocationProperties({ soil: 8, groundwater: 5, pollution: 80 });

    expect(locationProperties).toEqual({ soil: 2, groundwater: 1, pollution: 80 });
  });

  it("leaves the properties pollution does not spoil as they are", () => {
    const locationProperties = pollutedLocationProperties({ wind: 8, insolation: 5, pollution: 80 });

    expect(locationProperties).toEqual({ wind: 8, insolation: 5, pollution: 80 });
  });

  it("leaves the properties of a location which is not polluted as they are", () => {
    const locationProperties = pollutedLocationProperties({ soil: 8, groundwater: 5, pollution: 0 });

    expect(locationProperties).toEqual({ soil: 8, groundwater: 5, pollution: 0 });
  });

  // A location of a sektor made before there was pollution carries none of it.
  it("leaves the properties of a location without pollution as they are", () => {
    const locationProperties = pollutedLocationProperties({ soil: 8, groundwater: 5 });

    expect(locationProperties).toEqual({ soil: 8, groundwater: 5 });
  });
});

describe("output of a building on polluted ground", () => {
  it("is what is left of the location property once pollution has spoiled it", () => {
    const sektor = new Sektor([[{ properties: { soil: 8, pollution: 80 } }]], [...testDefinitions, TEST_HUB_DEFINITION], [IMPORT_EXPORT_RESOURCE]);
    sektor.createBuilding({ type: "Farm", location: { x: 0, y: 0 } });
    sektor.createBuilding(TEST_HUB);

    expect(sektor.getSektorState().exports).toEqual([{ name: "Wheat", value: 2 }]);
  });
});
