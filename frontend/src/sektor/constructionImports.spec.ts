import { describe, it, expect } from "vitest";
import { IMPORT_EXPORT_RESOURCE, Sektor } from "./Sektor";
import { BuildingDefinition } from "./buildings/parseBuildingDefinitions";
import { TEST_HUB, TEST_HUB_DEFINITION } from "./testImportExportHub";

const testDefinitions: BuildingDefinition[] = [
  {
    name: "Tower",
    renderingCodes: ["box s(1,1,1)"],
    buildingSize: 3,
    buildingFunctions: [],
    properties: {},
  },
  {
    name: "Shed",
    renderingCodes: ["box s(1,1,1)"],
    buildingSize: 1,
    buildingFunctions: [],
    properties: {},
  },
  {
    name: "Workshop",
    renderingCodes: ["box s(1,1,1)"],
    buildingSize: 2,
    buildingFunctions: [{
      inputs: [{ name: "Construction", value: 3 }],
      outputs: [{ name: "Noise", value: 1 }],
    }],
    properties: {},
  },
  {
    name: "ConstructionYard",
    renderingCodes: ["box s(1,1,1)"],
    buildingSize: 2,
    buildingFunctions: [{
      inputs: [],
      outputs: [{ name: "Construction", value: 10 }],
    }],
    properties: {},
  },
  {
    name: "Tent",
    renderingCodes: ["box s(1,1,1)"],
    buildingFunctions: [],
    properties: {},
  },
];

function sektorWith(buildingTypes: string[]): Sektor {
  const sektor = new Sektor(
    [buildingTypes.map(() => ({ properties: {} }))],
    [...testDefinitions, TEST_HUB_DEFINITION],
    [IMPORT_EXPORT_RESOURCE],
  );
  sektor.loadState({
    buildings: [
      ...buildingTypes.map((type, index) => ({ type, location: { x: index, y: 0 } })),
      TEST_HUB,
    ],
  });
  return sektor;
}

describe("construction imports", () => {
  it("imports as much Construction as all buildings together are big", () => {
    const sektor = sektorWith(["Tower", "Shed"]);

    expect(sektor.getSektorState().imports).toEqual([
      { name: "Construction", value: 4 },
    ]);
  });

  it("adds Construction of the buildings' size to what their functions import of it", () => {
    const sektor = sektorWith(["Workshop"]);

    expect(sektor.getSektorState().imports).toEqual([
      { name: "Construction", value: 5 },
    ]);
  });

  it("covers Construction with what the sektor makes before importing it", () => {
    const sektor = sektorWith(["ConstructionYard"]);

    const sektorState = sektor.getSektorState();

    expect({ imports: sektorState.imports, exports: sektorState.exports }).toEqual({
      imports: [{ name: "Construction", value: 0 }],
      exports: [{ name: "Construction", value: 8 }],
    });
  });

  it("imports no Construction for buildings without a size", () => {
    const sektor = sektorWith(["Tent"]);

    expect(sektor.getSektorState().imports).toEqual([]);
  });
});
