import { describe, it, expect } from "vitest";
import { BuildingLocation, Sektor } from "./Sektor";
import { BuildingDefinition } from "./buildings/parseBuildingDefinitions";

const testDefinitions: BuildingDefinition[] = [
  {
    name: "Workshop",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [
      {
        name: "Tool making",
        inputs: [{ name: "Ore", value: 4 }],
        outputs: [{ name: "Tools", value: 2 }],
      },
      {
        name: "Cart making",
        inputs: [{ name: "Wood", value: 3 }],
        outputs: [{ name: "Carts", value: 1 }],
      },
      {
        name: "Rope making",
        inputs: [{ name: "Hemp", value: 5 }],
        outputs: [{ name: "Rope", value: 6 }],
      },
    ],
    outputModifiers: [],
    properties: {},
  },
  {
    name: "Mill",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{
      inputs: [{ name: "Wheat", value: 4 }],
      outputs: [{ name: "Flour", value: 3 }],
    }],
    outputModifiers: [],
    properties: {},
  },
];

const buildingLocation: BuildingLocation = { x: 0, y: 0 };

function emptySektor(): Sektor {
  return new Sektor(
    [[{ properties: {} }]],
    testDefinitions,
    { importRestrictions: [], exportRequirements: [] },
    [],
  );
}

function sektorWith(buildingType: string): Sektor {
  const sektor = emptySektor();
  sektor.createBuilding({ type: buildingType, location: buildingLocation });
  return sektor;
}

function activations(sektor: Sektor): boolean[] {
  return sektor.getBuildingState(buildingLocation)!.buildingFunctions.map(functionState => functionState.active);
}

function throughputs(sektor: Sektor): { imports: { name: string, value: number }[], exports: { name: string, value: number }[] } {
  const sektorState = sektor.getSektorState();
  return {
    imports: sektorState.imports.map(entry => ({ name: entry.name, value: entry.value })),
    exports: sektorState.exports.map(entry => ({ name: entry.name, value: entry.value })),
  };
}

describe("initial function activation", () => {
  it("activates the only function of a building with a single function", () => {
    expect(activations(sektorWith("Mill"))).toEqual([true]);
  });

  it("activates only the first function of a building with several functions", () => {
    expect(activations(sektorWith("Workshop"))).toEqual([true, false, false]);
  });

  it("counts only the first function of a building with several functions", () => {
    expect(throughputs(sektorWith("Workshop"))).toEqual({
      imports: [{ name: "Ore", value: 4 }],
      exports: [{ name: "Tools", value: 2 }],
    });
  });
});

describe("activating a function", () => {
  it("marks the activated function as active", () => {
    const sektor = sektorWith("Workshop");

    sektor.activateFunction(buildingLocation, 2);

    expect(activations(sektor)).toEqual([true, false, true]);
  });

  it("counts the activated function's inputs and outputs", () => {
    const sektor = sektorWith("Workshop");

    sektor.activateFunction(buildingLocation, 2);

    expect(throughputs(sektor)).toEqual({
      imports: [
        { name: "Ore", value: 4 },
        { name: "Hemp", value: 5 },
      ],
      exports: [
        { name: "Tools", value: 2 },
        { name: "Rope", value: 6 },
      ],
    });
  });
});

describe("deactivating a function", () => {
  it("marks the deactivated function as inactive", () => {
    const sektor = sektorWith("Workshop");

    sektor.deactivateFunction(buildingLocation, 0);

    expect(activations(sektor)).toEqual([false, false, false]);
  });

  it("stops counting the deactivated function's inputs and outputs", () => {
    const sektor = sektorWith("Workshop");
    sektor.activateFunction(buildingLocation, 1);

    sektor.deactivateFunction(buildingLocation, 0);

    expect(throughputs(sektor)).toEqual({
      imports: [{ name: "Wood", value: 3 }],
      exports: [{ name: "Carts", value: 1 }],
    });
  });

  it("keeps the only function of a building with a single function active", () => {
    const sektor = sektorWith("Mill");

    sektor.deactivateFunction(buildingLocation, 0);

    expect({
      activations: activations(sektor),
      throughputs: throughputs(sektor),
    }).toEqual({
      activations: [true],
      throughputs: {
        imports: [{ name: "Wheat", value: 4 }],
        exports: [{ name: "Flour", value: 3 }],
      },
    });
  });
});

describe("saved function activation", () => {
  it("keeps the activations through a save and load", () => {
    const sektor = sektorWith("Workshop");
    sektor.activateFunction(buildingLocation, 1);
    sektor.deactivateFunction(buildingLocation, 0);

    const reloadedSektor = emptySektor();
    reloadedSektor.loadState(sektor.getState());

    expect(activations(reloadedSektor)).toEqual([false, true, false]);
  });
});
