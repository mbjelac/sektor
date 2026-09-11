import { describe, it, expect } from "vitest";
import { Building, BuildingLocation, Sektor } from "./Sektor";
import { BuildingDefinition } from "./buildings/parseBuildingDefinitions";

const testDefinitions: BuildingDefinition[] = [
  {
    name: "Workshop",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [
      {
        inputs: [{ name: "Ore", value: 4 }],
        outputs: [{ name: "Tools", value: 2 }],
      },
      {
        inputs: [{ name: "Wood", value: 3 }],
        outputs: [{ name: "Tools", value: 3 }],
      },
    ],
    outputModifiers: [],
    properties: {},
  },
];

const workshopLocation: BuildingLocation = { x: 0, y: 0 };

function createSektor(): Sektor {
  return new Sektor(
    [[{ properties: {} }]],
    testDefinitions,
    { importRestrictions: [], exportRequirements: [] },
    [],
    [],
  );
}

function sektorWithBuildings(buildings: Building[]): Sektor {
  const sektor = createSektor();
  sektor.loadState({ buildings });
  return sektor;
}

function throughputs(sektor: Sektor): { imports: { name: string, value: number }[], exports: { name: string, value: number }[] } {
  const sektorState = sektor.getSektorState();
  return {
    imports: sektorState.imports.map(entry => ({ name: entry.name, value: entry.value })),
    exports: sektorState.exports.map(entry => ({ name: entry.name, value: entry.value })),
  };
}

describe("outputs of several building functions", () => {
  it("adds up the outputs of the same resource", () => {
    const sektor = sektorWithBuildings([{ type: "Workshop", location: workshopLocation }]);
    sektor.activateFunction(workshopLocation, 1);

    expect(throughputs(sektor)).toEqual({
      imports: [
        { name: "Ore", value: 4 },
        { name: "Wood", value: 3 },
      ],
      exports: [{ name: "Tools", value: 5 }],
    });
  });
});
