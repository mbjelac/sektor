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

function capacities(sektor: Sektor): number[] {
  return sektor.getBuildingState(workshopLocation)!.buildingFunctions.map(buildingFunctionState => buildingFunctionState.capacity);
}

describe("outputs of several building functions", () => {
  it("adds up the outputs of the same resource", () => {
    const sektor = sektorWithBuildings([{ type: "Workshop", location: workshopLocation, capacities: [1, 1] }]);

    expect(throughputs(sektor)).toEqual({
      imports: [
        { name: "Ore", value: 4 },
        { name: "Wood", value: 3 },
      ],
      exports: [{ name: "Tools", value: 5 }],
    });
  });

  it("leaves out the amounts of a function turned off at capacity 0", () => {
    const sektor = sektorWithBuildings([{ type: "Workshop", location: workshopLocation, capacities: [1, 0] }]);

    expect(throughputs(sektor)).toEqual({
      imports: [
        { name: "Ore", value: 4 },
        { name: "Wood", value: 0 },
      ],
      exports: [{ name: "Tools", value: 2 }],
    });
  });

  it("adds up the outputs after applying each function's own capacity", () => {
    const sektor = sektorWithBuildings([{ type: "Workshop", location: workshopLocation, capacities: [0.1, 0.9] }]);

    expect(throughputs(sektor)).toEqual({
      imports: [
        { name: "Ore", value: 0.4 },
        { name: "Wood", value: 2.7 },
      ],
      exports: [{ name: "Tools", value: 2.9 }],
    });
  });
});

describe("capacities of several building functions", () => {
  it("gives every function of a created building its own capacity", () => {
    const sektor = createSektor();

    sektor.createBuilding({ type: "Workshop", location: workshopLocation });

    expect(capacities(sektor)).toEqual([0.1, 0.1]);
  });

  it("raises the capacity of only the function it is increased for", () => {
    const sektor = sektorWithBuildings([{ type: "Workshop", location: workshopLocation, capacities: [0.4, 0.4] }]);

    const capacity = sektor.increaseBuildingCapacity(workshopLocation, 1);

    expect({ capacity, capacities: capacities(sektor), ...throughputs(sektor) }).toEqual({
      capacity: 0.5,
      capacities: [0.4, 0.5],
      imports: [
        { name: "Ore", value: 1.6 },
        { name: "Wood", value: 1.5 },
      ],
      exports: [{ name: "Tools", value: 2.3 }],
    });
  });

  it("lowers the capacity of only the function it is decreased for", () => {
    const sektor = sektorWithBuildings([{ type: "Workshop", location: workshopLocation, capacities: [0.4, 0.4] }]);

    const capacity = sektor.decreaseBuildingCapacity(workshopLocation, 0);

    expect({ capacity, capacities: capacities(sektor), ...throughputs(sektor) }).toEqual({
      capacity: 0.3,
      capacities: [0.3, 0.4],
      imports: [
        { name: "Ore", value: 1.2 },
        { name: "Wood", value: 1.2 },
      ],
      exports: [{ name: "Tools", value: 1.8 }],
    });
  });

  it("throws when the building has no function at the given index", () => {
    const sektor = sektorWithBuildings([{ type: "Workshop", location: workshopLocation, capacities: [1, 1] }]);

    expect(() => sektor.increaseBuildingCapacity(workshopLocation, 2)).toThrowError("buildingFunctionNotFound");
  });
});
