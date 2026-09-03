import { describe, it, expect } from "vitest";
import { Building, Sektor } from "./Sektor";
import { BuildingDefinition } from "./buildings/parseBuildingDefinitions";

const testDefinitions: BuildingDefinition[] = [
  {
    name: "Pump",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{
      inputs: [{ name: "Energy", value: 10 }],
      outputs: [{ name: "Water", value: 20 }],
    }],
    outputModifiers: [],
    properties: {},
  },
  {
    name: "Farm",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{
      inputs: [{ name: "Water", value: 10 }],
      outputs: [{ name: "Food", value: 30 }],
    }],
    outputModifiers: [],
    properties: {},
  },
  {
    name: "Hut",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{
      inputs: [{ name: "Food", value: 7 }],
      outputs: [{ name: "Work", value: 3 }],
    }],
    outputModifiers: [],
    properties: {},
  },
];

function createSektor(): Sektor {
  return new Sektor(
    [[{ properties: {} }, { properties: {} }]],
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

describe("new building capacity", () => {
  it("is 0.1 for a created building", () => {
    const sektor = createSektor();

    sektor.createBuilding({ type: "Pump", location: { x: 0, y: 0 } });

    expect(sektor.getBuildingState({ x: 0, y: 0 })!.buildingFunctions[0].capacity).toEqual(0.1);
  });
});

describe("capacity scales inputs and outputs", () => {
  it("turns the building off at capacity 0", () => {
    const sektor = sektorWithBuildings([{ type: "Pump", location: { x: 0, y: 0 }, capacities: [0] }]);

    expect(throughputs(sektor)).toEqual({
      imports: [{ name: "Energy", value: 0 }],
      exports: [{ name: "Water", value: 0 }],
    });
  });

  it("takes a tenth of the building function's amounts at capacity 0.1", () => {
    const sektor = sektorWithBuildings([{ type: "Pump", location: { x: 0, y: 0 }, capacities: [0.1] }]);

    expect(throughputs(sektor)).toEqual({
      imports: [{ name: "Energy", value: 1 }],
      exports: [{ name: "Water", value: 2 }],
    });
  });

  it("takes half of the building function's amounts at capacity 0.5", () => {
    const sektor = sektorWithBuildings([{ type: "Pump", location: { x: 0, y: 0 }, capacities: [0.5] }]);

    expect(throughputs(sektor)).toEqual({
      imports: [{ name: "Energy", value: 5 }],
      exports: [{ name: "Water", value: 10 }],
    });
  });

  it("takes nine tenths of the building function's amounts at capacity 0.9", () => {
    const sektor = sektorWithBuildings([{ type: "Pump", location: { x: 0, y: 0 }, capacities: [0.9] }]);

    expect(throughputs(sektor)).toEqual({
      imports: [{ name: "Energy", value: 9 }],
      exports: [{ name: "Water", value: 18 }],
    });
  });

  it("takes the whole building function's amounts at capacity 1", () => {
    const sektor = sektorWithBuildings([{ type: "Pump", location: { x: 0, y: 0 }, capacities: [1] }]);

    expect(throughputs(sektor)).toEqual({
      imports: [{ name: "Energy", value: 10 }],
      exports: [{ name: "Water", value: 20 }],
    });
  });

  it("scales amounts which are not whole numbers", () => {
    const sektor = sektorWithBuildings([{ type: "Hut", location: { x: 0, y: 0 }, capacities: [0.3] }]);

    expect(throughputs(sektor)).toEqual({
      imports: [{ name: "Food", value: 2.1 }],
      exports: [{ name: "Work", value: 0.9 }],
    });
  });
});

describe("capacities of connected buildings", () => {
  it("feeds a building at capacity 0.1 from a building at capacity 1", () => {
    const sektor = sektorWithBuildings([
      { type: "Pump", location: { x: 0, y: 0 }, capacities: [1] },
      { type: "Farm", location: { x: 0, y: 1 }, capacities: [0.1] },
    ]);

    expect(throughputs(sektor)).toEqual({
      imports: [
        { name: "Energy", value: 10 },
        { name: "Water", value: 0 },
      ],
      exports: [
        { name: "Water", value: 19 },
        { name: "Food", value: 3 },
      ],
    });
  });

  it("feeds a building at capacity 0.5 from a building at capacity 0.9", () => {
    const sektor = sektorWithBuildings([
      { type: "Pump", location: { x: 0, y: 0 }, capacities: [0.9] },
      { type: "Farm", location: { x: 0, y: 1 }, capacities: [0.5] },
    ]);

    expect(throughputs(sektor)).toEqual({
      imports: [
        { name: "Energy", value: 9 },
        { name: "Water", value: 0 },
      ],
      exports: [
        { name: "Water", value: 13 },
        { name: "Food", value: 15 },
      ],
    });
  });

  it("neither consumes nor produces for a building at capacity 0 next to a working building", () => {
    const sektor = sektorWithBuildings([
      { type: "Pump", location: { x: 0, y: 0 }, capacities: [0.5] },
      { type: "Farm", location: { x: 0, y: 1 }, capacities: [0] },
    ]);

    expect(throughputs(sektor)).toEqual({
      imports: [
        { name: "Energy", value: 5 },
        { name: "Water", value: 0 },
      ],
      exports: [
        { name: "Water", value: 10 },
        { name: "Food", value: 0 },
      ],
    });
  });
});

describe("increaseBuildingCapacity", () => {
  it("raises the capacity by 0.1 and scales the amounts up", () => {
    const sektor = sektorWithBuildings([{ type: "Pump", location: { x: 0, y: 0 }, capacities: [0.4] }]);

    const capacity = sektor.increaseBuildingCapacity({ x: 0, y: 0 }, 0);

    expect({ capacity, ...throughputs(sektor) }).toEqual({
      capacity: 0.5,
      imports: [{ name: "Energy", value: 5 }],
      exports: [{ name: "Water", value: 10 }],
    });
  });

  it("does not raise the capacity above 1", () => {
    const sektor = sektorWithBuildings([{ type: "Pump", location: { x: 0, y: 0 }, capacities: [0.9] }]);

    sektor.increaseBuildingCapacity({ x: 0, y: 0 }, 0);
    const capacity = sektor.increaseBuildingCapacity({ x: 0, y: 0 }, 0);

    expect({ capacity, ...throughputs(sektor) }).toEqual({
      capacity: 1,
      imports: [{ name: "Energy", value: 10 }],
      exports: [{ name: "Water", value: 20 }],
    });
  });

  it("raises the capacity all the way to 1 in one call", () => {
    const sektor = sektorWithBuildings([{ type: "Pump", location: { x: 0, y: 0 }, capacities: [0.2] }]);

    const capacity = sektor.increaseBuildingCapacity({ x: 0, y: 0 }, 0, true);

    expect({ capacity, ...throughputs(sektor) }).toEqual({
      capacity: 1,
      imports: [{ name: "Energy", value: 10 }],
      exports: [{ name: "Water", value: 20 }],
    });
  });

  it("throws when there is no building at the location", () => {
    const sektor = createSektor();

    expect(() => sektor.increaseBuildingCapacity({ x: 0, y: 0 }, 0)).toThrowError("buildingNotFound");
  });
});

describe("decreaseBuildingCapacity", () => {
  it("lowers the capacity by 0.1 and scales the amounts down", () => {
    const sektor = sektorWithBuildings([{ type: "Pump", location: { x: 0, y: 0 }, capacities: [1] }]);

    const capacity = sektor.decreaseBuildingCapacity({ x: 0, y: 0 }, 0);

    expect({ capacity, ...throughputs(sektor) }).toEqual({
      capacity: 0.9,
      imports: [{ name: "Energy", value: 9 }],
      exports: [{ name: "Water", value: 18 }],
    });
  });

  it("turns the building off when lowered to 0", () => {
    const sektor = sektorWithBuildings([{ type: "Pump", location: { x: 0, y: 0 }, capacities: [0.1] }]);

    const capacity = sektor.decreaseBuildingCapacity({ x: 0, y: 0 }, 0);

    expect({ capacity, ...throughputs(sektor) }).toEqual({
      capacity: 0,
      imports: [{ name: "Energy", value: 0 }],
      exports: [{ name: "Water", value: 0 }],
    });
  });

  it("does not lower the capacity below 0", () => {
    const sektor = sektorWithBuildings([{ type: "Pump", location: { x: 0, y: 0 }, capacities: [0.1] }]);

    sektor.decreaseBuildingCapacity({ x: 0, y: 0 }, 0);
    const capacity = sektor.decreaseBuildingCapacity({ x: 0, y: 0 }, 0);

    expect({ capacity, ...throughputs(sektor) }).toEqual({
      capacity: 0,
      imports: [{ name: "Energy", value: 0 }],
      exports: [{ name: "Water", value: 0 }],
    });
  });

  it("lowers the capacity all the way to 0 in one call", () => {
    const sektor = sektorWithBuildings([{ type: "Pump", location: { x: 0, y: 0 }, capacities: [0.8] }]);

    const capacity = sektor.decreaseBuildingCapacity({ x: 0, y: 0 }, 0, true);

    expect({ capacity, ...throughputs(sektor) }).toEqual({
      capacity: 0,
      imports: [{ name: "Energy", value: 0 }],
      exports: [{ name: "Water", value: 0 }],
    });
  });

  it("throws when there is no building at the location", () => {
    const sektor = createSektor();

    expect(() => sektor.decreaseBuildingCapacity({ x: 0, y: 0 }, 0)).toThrowError("buildingNotFound");
  });
});
