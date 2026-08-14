import { describe, it, expect } from "vitest";
import { Sektor } from "./Sektor";
import { BuildingDefinition } from "./buildings/parseBuildingDefinitions";

const testDefinitions: BuildingDefinition[] = [
  {
    name: "Mill",
    renderingCode: "box s(1,1,1)",
    buildingFunction: {
      inputs: [{ name: "Wheat", value: 4 }],
      outputs: [{ name: "Flour", value: 3 }],
    },
    outputModifiers: [],
    boosters: [],
    properties: {},
  },
  {
    name: "Farm",
    renderingCode: "box s(1,1,1)",
    buildingFunction: {
      inputs: [{ name: "Water", value: 2 }],
      outputs: [{ name: "Wheat", value: 5 }],
    },
    outputModifiers: [],
    boosters: [],
    properties: {},
  },
];

describe("changeConnectionAmount", () => {
  it("increases connection amount", () => {
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, { importRestrictions: [], exportRequirements: [] });
    sektor.loadState({
      buildings: [
        { type: "Mill", location: { x: 0, y: 0 } },
        { type: "Farm", location: { x: 1, y: 0 } },
      ],
      connections: [],
    });
    sektor.addConnection({ x: 0, y: 0 }, { x: 1, y: 0 }, "Wheat");

    const result = sektor.changeConnectionAmount({ x: 0, y: 0 }, { x: 1, y: 0 }, "Wheat", 2);

    expect(result).toEqual({ success: true, newAmount: 3 });
  });

  it("decreases connection amount", () => {
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, { importRestrictions: [], exportRequirements: [] });
    sektor.loadState({
      buildings: [
        { type: "Mill", location: { x: 0, y: 0 } },
        { type: "Farm", location: { x: 1, y: 0 } },
      ],
      connections: [],
    });
    sektor.addConnection({ x: 0, y: 0 }, { x: 1, y: 0 }, "Wheat");
    sektor.changeConnectionAmount({ x: 0, y: 0 }, { x: 1, y: 0 }, "Wheat", 2);

    const result = sektor.changeConnectionAmount({ x: 0, y: 0 }, { x: 1, y: 0 }, "Wheat", -1);

    expect(result).toEqual({ success: true, newAmount: 2 });
  });

  it("reflects new amount in building state input connections", () => {
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, { importRestrictions: [], exportRequirements: [] });
    sektor.loadState({
      buildings: [
        { type: "Mill", location: { x: 0, y: 0 } },
        { type: "Farm", location: { x: 1, y: 0 } },
      ],
      connections: [],
    });
    sektor.addConnection({ x: 0, y: 0 }, { x: 1, y: 0 }, "Wheat");
    sektor.changeConnectionAmount({ x: 0, y: 0 }, { x: 1, y: 0 }, "Wheat", 2);

    const state = sektor.getBuildingState({ x: 0, y: 0 });

    expect(state!.inputConnections).toEqual([
      { to: { x: 1, y: 0 }, resourceType: "Wheat", amount: 3 },
    ]);
  });

  it("updates imports and exports when amount changes", () => {
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, { importRestrictions: [], exportRequirements: [] });
    sektor.loadState({
      buildings: [
        { type: "Mill", location: { x: 0, y: 0 } },
        { type: "Farm", location: { x: 1, y: 0 } },
      ],
      connections: [],
    });
    sektor.addConnection({ x: 0, y: 0 }, { x: 1, y: 0 }, "Wheat");
    sektor.changeConnectionAmount({ x: 0, y: 0 }, { x: 1, y: 0 }, "Wheat", 2);

    const result = sektor.getSektorState();

    expect(result).toEqual({
      imports: [
        { name: "Wheat", value: 1 },
        { name: "Water", value: 2 },
      ],
      exports: [
        { name: "Flour", value: 3 },
        { name: "Wheat", value: 2 },
      ],
      status: "Done",
      importRestrictions: [],
      exportRequirements: [],
    });
  });

  it("fails with cannotDecreaseBelowZero when delta would make amount negative", () => {
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, { importRestrictions: [], exportRequirements: [] });
    sektor.loadState({
      buildings: [
        { type: "Mill", location: { x: 0, y: 0 } },
        { type: "Farm", location: { x: 1, y: 0 } },
      ],
      connections: [],
    });
    sektor.addConnection({ x: 0, y: 0 }, { x: 1, y: 0 }, "Wheat");

    const result = sektor.changeConnectionAmount({ x: 0, y: 0 }, { x: 1, y: 0 }, "Wheat", -2);

    expect(result).toEqual({ success: false, error: "cannotDecreaseBelowZero", newAmount: 1 });
  });

  it("fails with inputOverflow when delta would exceed target input amount", () => {
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, { importRestrictions: [], exportRequirements: [] });
    sektor.loadState({
      buildings: [
        { type: "Mill", location: { x: 0, y: 0 } },
        { type: "Farm", location: { x: 1, y: 0 } },
      ],
      connections: [],
    });
    sektor.addConnection({ x: 0, y: 0 }, { x: 1, y: 0 }, "Wheat");

    const result = sektor.changeConnectionAmount({ x: 0, y: 0 }, { x: 1, y: 0 }, "Wheat", 4);

    expect(result).toEqual({ success: false, error: "inputOverflow", newAmount: 1 });
  });

  it("fails with outputOverflow when delta would exceed source output amount", () => {
    const definitions: BuildingDefinition[] = [
      {
        name: "BigMill",
        renderingCode: "box s(1,1,1)",
        buildingFunction: {
          inputs: [{ name: "Wheat", value: 10 }],
          outputs: [{ name: "Flour", value: 3 }],
        },
        outputModifiers: [],
    boosters: [],
    properties: {},
      },
      {
        name: "SmallFarm",
        renderingCode: "box s(1,1,1)",
        buildingFunction: {
          inputs: [{ name: "Water", value: 2 }],
          outputs: [{ name: "Wheat", value: 3 }],
        },
        outputModifiers: [],
    boosters: [],
    properties: {},
      },
    ];
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], definitions, { importRestrictions: [], exportRequirements: [] });
    sektor.loadState({
      buildings: [
        { type: "BigMill", location: { x: 0, y: 0 } },
        { type: "SmallFarm", location: { x: 1, y: 0 } },
      ],
      connections: [],
    });
    sektor.addConnection({ x: 0, y: 0 }, { x: 1, y: 0 }, "Wheat");

    // SmallFarm has Wheat output 3, connection at 1. Delta 3 would make it 4 > 3.
    // BigMill has Wheat input 10, so input is not the bottleneck.
    const result = sektor.changeConnectionAmount({ x: 0, y: 0 }, { x: 1, y: 0 }, "Wheat", 3);

    expect(result).toEqual({ success: false, error: "outputOverflow", newAmount: 1 });
  });
});
