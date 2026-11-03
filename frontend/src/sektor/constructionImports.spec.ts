import { describe, it, expect } from "vitest";
import { IMPORT_EXPORT_RESOURCE, Sektor } from "./Sektor";
import { BuildingDefinition } from "./buildings/parseBuildingDefinitions";
import { TEST_HUB, TEST_HUB_DEFINITION } from "./testImportExportHub";

const testDefinitions: BuildingDefinition[] = [
  {
    name: "Tower",
    renderingCodes: ["box s(1,1,1)"],
    constructionResources: [
      { name: "Glass", value: 5 },
      { name: "Concrete", value: 12 },
      { name: "Steel", value: 7 },
    ],
    buildingFunctions: [],
    properties: {},
  },
  {
    name: "Shed",
    renderingCodes: ["box s(1,1,1)"],
    constructionResources: [
      { name: "Glass", value: 3 },
      { name: "Concrete", value: 9 },
      { name: "Steel", value: 9 },
    ],
    buildingFunctions: [],
    properties: {},
  },
  {
    name: "Mixer",
    renderingCodes: ["box s(1,1,1)"],
    constructionResources: [
      { name: "Concrete", value: 20 },
    ],
    buildingFunctions: [{
      inputs: [{ name: "Concrete", value: 3 }],
      outputs: [{ name: "Noise", value: 1 }],
    }],
    properties: {},
  },
  {
    name: "Kiln",
    renderingCodes: ["box s(1,1,1)"],
    constructionResources: [
      { name: "Concrete", value: 20 },
      { name: "Glass", value: 4 },
    ],
    buildingFunctions: [{
      inputs: [],
      outputs: [{ name: "Concrete", value: 10 }],
    }],
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
  it("imports a tenth of every construction resource of all buildings together, rounded", () => {
    const sektor = sektorWith(["Tower", "Shed"]);

    expect(sektor.getSektorState().imports).toEqual([
      { name: "Glass", value: 1 },
      { name: "Concrete", value: 2 },
      { name: "Steel", value: 2 },
    ]);
  });

  it("adds construction resources to what the buildings' functions import of the same resource", () => {
    const sektor = sektorWith(["Mixer"]);

    expect(sektor.getSektorState().imports).toEqual([
      { name: "Concrete", value: 5 },
    ]);
  });

  it("covers construction resources with what the sektor makes before importing them, leaving out those rounded to nothing", () => {
    const sektor = sektorWith(["Kiln"]);

    const sektorState = sektor.getSektorState();

    expect({ imports: sektorState.imports, exports: sektorState.exports }).toEqual({
      imports: [{ name: "Concrete", value: 0 }],
      exports: [{ name: "Concrete", value: 8 }],
    });
  });
});
