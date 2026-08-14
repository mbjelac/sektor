import { describe, it, expect } from "vitest";
import { Sektor } from "./Sektor";
import { BuildingDefinition } from "./buildings/parseBuildingDefinitions";

const testDefinitions: BuildingDefinition[] = [
  {
    name: "Mill",
    renderingCode: "box s(1,1,1)",
    buildingFunction: {
      inputs: [
        { name: "Wheat", value: 4 },
        { name: "Energy", value: 2 },
      ],
      outputs: [
        { name: "Flour", value: 3 },
      ],
    },
    outputModifiers: [],
    boosters: [],
    properties: {},
  },
];

describe("getBuildingState", () => {
  it("returns null when no building at location", () => {
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, { importRestrictions: [], exportRequirements: [] });

    expect(sektor.getBuildingState({ x: 0, y: 0 })).toEqual(null);
  });

  it("returns building function and imports for a placed building", () => {
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, { importRestrictions: [], exportRequirements: [] });
    sektor.createBuilding({ type: "Mill", location: { x: 3, y: 5 } });

    const state = sektor.getBuildingState({ x: 3, y: 5 });

    expect(state).toEqual({
      buildingFunction: {
        inputs: [
          { name: "Wheat", value: 4 },
          { name: "Energy", value: 2 },
        ],
        outputs: [
          { name: "Flour", value: 3 },
        ],
      },
      modifiedOutputs: [
        { name: "Flour", value: 3 },
      ],
      exports: [
        { name: "Flour", value: 3 },
      ],
      imports: [
        { name: "Wheat", value: 4 },
        { name: "Energy", value: 2 },
      ],
      inputConnections: [],
      outputConnections: [],
    });
  });

  it("returns input connections after a connection is added", () => {
    const testDefinitionsWithFarm: BuildingDefinition[] = [
      ...testDefinitions,
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
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitionsWithFarm, { importRestrictions: [], exportRequirements: [] });
    sektor.loadState({
      buildings: [
        { type: "Mill", location: { x: 0, y: 0 } },
        { type: "Farm", location: { x: 1, y: 0 } },
      ],
      connections: [],
    });
    sektor.addConnection({ x: 0, y: 0 }, { x: 1, y: 0 }, "Wheat");

    const state = sektor.getBuildingState({ x: 0, y: 0 });

    expect(state!.inputConnections).toEqual([
      { to: { x: 1, y: 0 }, resourceType: "Wheat", amount: 1 },
    ]);
  });

  it("returns output connections after a connection is added", () => {
    const testDefinitionsWithFarm: BuildingDefinition[] = [
      ...testDefinitions,
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
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitionsWithFarm, { importRestrictions: [], exportRequirements: [] });
    sektor.loadState({
      buildings: [
        { type: "Mill", location: { x: 0, y: 0 } },
        { type: "Farm", location: { x: 1, y: 0 } },
      ],
      connections: [],
    });
    sektor.addConnection({ x: 0, y: 0 }, { x: 1, y: 0 }, "Wheat");

    const state = sektor.getBuildingState({ x: 1, y: 0 });

    expect(state!.outputConnections).toEqual([
      { to: { x: 0, y: 0 }, resourceType: "Wheat", amount: 1 },
    ]);
  });

  it("returns exports reduced by connected amount", () => {
    const testDefinitionsWithFarm: BuildingDefinition[] = [
      ...testDefinitions,
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
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitionsWithFarm, { importRestrictions: [], exportRequirements: [] });
    sektor.loadState({
      buildings: [
        { type: "Mill", location: { x: 0, y: 0 } },
        { type: "Farm", location: { x: 1, y: 0 } },
      ],
      connections: [],
    });
    sektor.addConnection({ x: 0, y: 0 }, { x: 1, y: 0 }, "Wheat");

    const state = sektor.getBuildingState({ x: 1, y: 0 });

    expect(state!.exports).toEqual([
      { name: "Wheat", value: 4 },
    ]);
  });
});
