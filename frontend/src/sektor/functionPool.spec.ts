import { describe, it, expect } from "vitest";
import { BuildingLocation, HAPINESS_RESOURCE, IMPORT_EXPORT_RESOURCE, Sektor } from "./Sektor";
import { TEST_HUB, TEST_HUB_DEFINITION } from "./testImportExportHub";
import { BuildingDefinition } from "./buildings/parseBuildingDefinitions";

// A workshop making tools always, and carts and wagons as many times over as its pool of 5 allows.
const testDefinitions: BuildingDefinition[] = [
  {
    name: "Workshop",
    renderingCodes: ["box s(1,1,1)"],
    buildingFunctions: [
      {
        inputs: [{ name: "Ore", value: 2 }],
        outputs: [{ name: "Tools", value: 1 }],
      },
      {
        pool: true,
        inputs: [{ name: "Wood", value: 3 }],
        outputs: [{ name: "Carts", value: 2 }],
      },
      {
        pool: true,
        inputs: [{ name: "Wood", value: 4 }],
        outputs: [{ name: "Wagons", value: 1 }],
      },
    ],
    properties: { poolSize: 5 },
  },
  {
    name: "Spring",
    renderingCodes: ["box s(1,1,1)"],
    buildingFunctions: [{ inputs: [], outputs: [{ name: "Steam", value: 5 }] }],
    properties: {},
  },
  {
    name: "Bathhouse",
    renderingCodes: ["box s(1,1,1)"],
    buildingFunctions: [{
      pool: true,
      inputs: [{ name: "Steam", value: 3 }],
      outputs: [{ name: HAPINESS_RESOURCE, value: 1 }],
    }],
    properties: { poolSize: 3 },
  },
];

const workshopLocation: BuildingLocation = { x: 0, y: 0 };

function sektorWithWorkshop(): Sektor {
  const sektor = new Sektor([[{ properties: {} }]], [...testDefinitions, TEST_HUB_DEFINITION], [IMPORT_EXPORT_RESOURCE]);
  sektor.loadState({ buildings: [{ type: "Workshop", location: workshopLocation }, TEST_HUB] });
  return sektor;
}

function multipliersAndUnusedPool(sektor: Sektor) {
  const buildingState = sektor.getBuildingState(workshopLocation)!;
  return {
    multipliers: buildingState.buildingFunctions.map(buildingFunctionState => buildingFunctionState.multiplier),
    unusedPool: buildingState.unusedPool,
  };
}

describe("function pool", () => {
  it("starts every function drawing on the pool at no times over, leaving the pool unused", () => {
    expect(multipliersAndUnusedPool(sektorWithWorkshop())).toEqual({ multipliers: [undefined, 0, 0], unusedPool: 5 });
  });

  it("sets the multiplier of a function drawing on the pool, as long as the pool holds it", () => {
    const sektor = sektorWithWorkshop();

    sektor.setFunctionMultiplier(workshopLocation, 1, 4);
    const afterFirst = multipliersAndUnusedPool(sektor);
    sektor.setFunctionMultiplier(workshopLocation, 2, 2);
    const beyondPool = multipliersAndUnusedPool(sektor);
    sektor.setFunctionMultiplier(workshopLocation, 2, 1);
    const fillingPool = multipliersAndUnusedPool(sektor);
    sektor.setFunctionMultiplier(workshopLocation, 1, 0);
    const afterZero = multipliersAndUnusedPool(sektor);

    expect({ afterFirst, beyondPool, fillingPool, afterZero }).toEqual({
      afterFirst: { multipliers: [undefined, 4, 0], unusedPool: 1 },
      beyondPool: { multipliers: [undefined, 4, 0], unusedPool: 1 },
      fillingPool: { multipliers: [undefined, 4, 1], unusedPool: 0 },
      afterZero: { multipliers: [undefined, 0, 1], unusedPool: 4 },
    });
  });

  it("takes no multiplier below zero, of a fraction, or for a function not drawing on the pool", () => {
    const sektor = sektorWithWorkshop();

    sektor.setFunctionMultiplier(workshopLocation, 1, -1);
    sektor.setFunctionMultiplier(workshopLocation, 1, 1.5);
    sektor.setFunctionMultiplier(workshopLocation, 0, 2);

    expect(multipliersAndUnusedPool(sektor)).toEqual({ multipliers: [undefined, 0, 0], unusedPool: 5 });
  });

  it("keeps the multipliers in the state the sektor is saved and loaded with", () => {
    const sektor = sektorWithWorkshop();
    sektor.setFunctionMultiplier(workshopLocation, 2, 3);

    const loadedSektor = new Sektor([[{ properties: {} }]], [...testDefinitions, TEST_HUB_DEFINITION], [IMPORT_EXPORT_RESOURCE]);
    loadedSektor.loadState(sektor.getState());

    expect(multipliersAndUnusedPool(loadedSektor)).toEqual({ multipliers: [undefined, 0, 3], unusedPool: 2 });
  });

  it("imports and exports what the functions drawing on the pool take in and give out, as many times over as they are done", () => {
    const sektor = sektorWithWorkshop();
    sektor.setFunctionMultiplier(workshopLocation, 1, 2);
    sektor.setFunctionMultiplier(workshopLocation, 2, 1);

    const sektorState = sektor.getSektorState();

    expect({ imports: sektorState.imports, exports: sektorState.exports }).toEqual({
      imports: [{ name: "Ore", value: 2 }, { name: "Wood", value: 10 }],
      exports: [{ name: "Tools", value: 1 }, { name: "Carts", value: 4 }, { name: "Wagons", value: 1 }],
    });
  });

  // The spring gives off 5 Steam, enough for the bathhouse done once but not twice.
  it("starves a function drawing on the pool done more times over than the local resource it takes in allows", () => {
    const bathhouseLocation = { x: 1, y: 0 };
    const sektor = new Sektor([[{ properties: {} }], [{ properties: {} }]], [...testDefinitions, TEST_HUB_DEFINITION], ["Steam", HAPINESS_RESOURCE, IMPORT_EXPORT_RESOURCE]);
    sektor.loadState({ buildings: [{ type: "Spring", location: { x: 0, y: 0 } }, { type: "Bathhouse", location: bathhouseLocation }, TEST_HUB] });

    sektor.setFunctionMultiplier(bathhouseLocation, 0, 1);
    const doneOnce = sektor.getSektorState();
    sektor.setFunctionMultiplier(bathhouseLocation, 0, 2);
    const doneTwice = sektor.getSektorState();

    expect([doneOnce, doneTwice].map(sektorState => ({
      starvedFunctions: sektorState.starvedFunctions,
      hapiness: sektorState.hapiness,
      possibleHapiness: sektorState.possibleHapiness,
    }))).toEqual([
      { starvedFunctions: [], hapiness: 1, possibleHapiness: 1 },
      { starvedFunctions: [{ buildingLocation: bathhouseLocation, functionIndex: 0 }], hapiness: 0, possibleHapiness: 2 },
    ]);
  });
});
