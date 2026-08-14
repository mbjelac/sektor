import { describe, it, expect } from "vitest";
import { Sektor } from "./Sektor";
import { BuildingDefinition } from "./buildings/parseBuildingDefinitions";

const testDefinitions: BuildingDefinition[] = [
  {
    name: "Habitat",
    renderingCode: "box s(1,1,1)",
    buildingFunction: {
      inputs: [{ name: "Food", value: 2 }],
      outputs: [{ name: "Work", value: 5 }],
    },
    outputModifiers: [],
    boosters: [
      { input: { name: "HealthMental", value: 3 }, outputBoost: [{ name: "Work", value: 2 }] },
    ],
    properties: {},
  },
  {
    name: "Library",
    renderingCode: "box s(1,1,1)",
    buildingFunction: {
      inputs: [],
      outputs: [{ name: "HealthMental", value: 10 }],
    },
    outputModifiers: [],
    boosters: [],
    properties: {},
  },
];

function newSektor(): Sektor {
  return new Sektor([[{ properties: {} }]], testDefinitions, { importRestrictions: [], exportRequirements: [] });
}

describe("boosters", () => {
  it("building with boosters functions without connecting them", () => {
    const sektor = newSektor();
    sektor.createBuilding({ type: "Habitat", location: { x: 0, y: 0 } });

    expect(sektor.getSektorState()).toEqual({
      imports: [{ name: "Food", value: 2 }],
      exports: [{ name: "Work", value: 5 }],
      status: "Done",
      importRestrictions: [],
      exportRequirements: [],
    });
  });

  it("does not boost output when booster input is not connected", () => {
    const sektor = newSektor();
    sektor.createBuilding({ type: "Habitat", location: { x: 0, y: 0 } });

    expect(sektor.getBuildingState({ x: 0, y: 0 })!.modifiedOutputs).toEqual([
      { name: "Work", value: 5 },
    ]);
  });

  it("does not increase sektor imports with unconnected booster amounts", () => {
    const sektor = newSektor();
    sektor.createBuilding({ type: "Habitat", location: { x: 0, y: 0 } });

    expect(sektor.getSektorState().imports).toEqual([
      { name: "Food", value: 2 },
    ]);
  });

  it("increases output by connected booster amount times boost factor", () => {
    const sektor = newSektor();
    sektor.loadState({
      buildings: [
        { type: "Habitat", location: { x: 0, y: 0 } },
        { type: "Library", location: { x: 1, y: 0 } },
      ],
      connections: [],
    });
    sektor.addConnection({ x: 0, y: 0 }, { x: 1, y: 0 }, "HealthMental");
    sektor.changeConnectionAmount({ x: 0, y: 0 }, { x: 1, y: 0 }, "HealthMental", 2);

    expect(sektor.getBuildingState({ x: 0, y: 0 })!.modifiedOutputs).toEqual([
      { name: "Work", value: 11 },
    ]);
  });

  it("cannot increase a booster input beyond its maximum amount", () => {
    const sektor = newSektor();
    sektor.loadState({
      buildings: [
        { type: "Habitat", location: { x: 0, y: 0 } },
        { type: "Library", location: { x: 1, y: 0 } },
      ],
      connections: [],
    });
    sektor.addConnection({ x: 0, y: 0 }, { x: 1, y: 0 }, "HealthMental");
    sektor.changeConnectionAmount({ x: 0, y: 0 }, { x: 1, y: 0 }, "HealthMental", 2);

    expect(sektor.changeConnectionAmount({ x: 0, y: 0 }, { x: 1, y: 0 }, "HealthMental", 1)).toEqual({
      success: false,
      error: "inputOverflow",
      newAmount: 3,
    });
  });
});
