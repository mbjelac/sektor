import { describe, it, expect } from "vitest";
import { Sektor } from "./Sektor";
import { BuildingDefinition } from "./buildings/parseBuildingDefinitions";

const testDefinitions: BuildingDefinition[] = [
  {
    name: "Well",
    renderingCode: "box s(1,1,1)",
    buildingFunction: {
      inputs: [
        { name: "Energy", value: 8 },
        { name: "Work", value: 3 },
      ],
      outputs: [
        { name: "Water", value: 4 },
      ],
    },
    outputModifiers: [],
    properties: {},
  },
  {
    name: "Farm",
    renderingCode: "box s(1,1,1)",
    buildingFunction: {
      inputs: [
        { name: "Water", value: 3 },
        { name: "Energy", value: 1 },
        { name: "Work", value: 5 },
      ],
      outputs: [
        { name: "Food", value: 5 },
      ],
    },
    outputModifiers: [],
    properties: {},
  },
];

describe("getSektorState", () => {
  it("returns empty imports and exports when there are no buildings", () => {
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, { importRestrictions: [], exportRequirements: [] });

    const result = sektor.getSektorState();

    expect(result).toEqual({
      imports: [],
      exports: [],
      status: "Done",
      importRestrictions: [],
      exportRequirements: [],
    });
  });

  it("returns imports and exports for a single building", () => {
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, { importRestrictions: [], exportRequirements: [] });
    sektor.createBuilding({ type: "Well", location: { x: 0, y: 0 } });

    const result = sektor.getSektorState();

    expect(result).toEqual({
      imports: [
        { name: "Energy", value: 8 },
        { name: "Work", value: 3 },
      ],
      exports: [
        { name: "Water", value: 4 },
      ],
      status: "Done",
      importRestrictions: [],
      exportRequirements: [],
    });
  });

  it("aggregates imports and exports by resource name across buildings", () => {
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, { importRestrictions: [], exportRequirements: [] });
    sektor.loadState({
      buildings: [
        { type: "Well", location: { x: 0, y: 0 } },
        { type: "Farm", location: { x: 1, y: 0 } },
      ],
    });

    const result = sektor.getSektorState();

    expect(result).toEqual({
      imports: [
        { name: "Energy", value: 9 },
        { name: "Work", value: 8 },
        { name: "Water", value: 0 },
      ],
      exports: [
        { name: "Water", value: 1 },
        { name: "Food", value: 5 },
      ],
      status: "Done",
      importRestrictions: [],
      exportRequirements: [],
    });
  });
});

const poolDefinitions: BuildingDefinition[] = [
  {
    name: "Consumer",
    renderingCode: "box s(1,1,1)",
    buildingFunction: {
      inputs: [{ name: "Water", value: 5 }],
      outputs: [],
    },
    outputModifiers: [],
    properties: {},
  },
  {
    name: "Producer",
    renderingCode: "box s(1,1,1)",
    buildingFunction: {
      inputs: [],
      outputs: [{ name: "Water", value: 7 }],
    },
    outputModifiers: [],
    properties: {},
  },
  {
    name: "BigProducer",
    renderingCode: "box s(1,1,1)",
    buildingFunction: {
      inputs: [],
      outputs: [{ name: "Water", value: 10 }],
    },
    outputModifiers: [],
    properties: {},
  },
];

describe("resource pool", () => {
  it("imports the amount by which inputs exceed outputs", () => {
    const sektor = new Sektor([[{ properties: {} }]], poolDefinitions, { importRestrictions: [], exportRequirements: [] });
    sektor.loadState({
      buildings: [
        { type: "Consumer", location: { x: 0, y: 0 } },
        { type: "Consumer", location: { x: 1, y: 0 } },
        { type: "Producer", location: { x: 2, y: 0 } },
      ],
    });

    expect({
      imports: sektor.getSektorState().imports,
      exports: sektor.getSektorState().exports,
    }).toEqual({
      imports: [{ name: "Water", value: 3 }],
      exports: [{ name: "Water", value: 0 }],
    });
  });

  it("exports the amount by which outputs exceed inputs", () => {
    const sektor = new Sektor([[{ properties: {} }]], poolDefinitions, { importRestrictions: [], exportRequirements: [] });
    sektor.loadState({
      buildings: [
        { type: "Consumer", location: { x: 0, y: 0 } },
        { type: "Producer", location: { x: 1, y: 0 } },
      ],
    });

    expect({
      imports: sektor.getSektorState().imports,
      exports: sektor.getSektorState().exports,
    }).toEqual({
      imports: [{ name: "Water", value: 0 }],
      exports: [{ name: "Water", value: 2 }],
    });
  });

  it("neither imports nor exports when outputs equal inputs", () => {
    const sektor = new Sektor([[{ properties: {} }]], poolDefinitions, { importRestrictions: [], exportRequirements: [] });
    sektor.loadState({
      buildings: [
        { type: "Consumer", location: { x: 0, y: 0 } },
        { type: "Consumer", location: { x: 1, y: 0 } },
        { type: "BigProducer", location: { x: 2, y: 0 } },
      ],
    });

    expect({
      imports: sektor.getSektorState().imports,
      exports: sektor.getSektorState().exports,
    }).toEqual({
      imports: [{ name: "Water", value: 0 }],
      exports: [{ name: "Water", value: 0 }],
    });
  });

  it("exports the freed amount when a consuming building is destroyed", () => {
    const sektor = new Sektor([[{ properties: {} }]], poolDefinitions, { importRestrictions: [], exportRequirements: [] });
    sektor.loadState({
      buildings: [
        { type: "Consumer", location: { x: 0, y: 0 } },
        { type: "Consumer", location: { x: 1, y: 0 } },
        { type: "BigProducer", location: { x: 2, y: 0 } },
      ],
    });

    sektor.destroyBuilding({ x: 1, y: 0 });

    expect({
      imports: sektor.getSektorState().imports,
      exports: sektor.getSektorState().exports,
    }).toEqual({
      imports: [{ name: "Water", value: 0 }],
      exports: [{ name: "Water", value: 5 }],
    });
  });
});

const statusDefinitions: BuildingDefinition[] = [
  {
    name: "Generator",
    renderingCode: "box s(1,1,1)",
    buildingFunction: {
      inputs: [
        { name: "Coal", value: 5 },
      ],
      outputs: [
        { name: "Power", value: 10 },
      ],
    },
    outputModifiers: [],
    properties: {},
  },
];

describe("status", () => {
  it("is Done when no buildings, no restrictions, no requirements", () => {
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], statusDefinitions, { importRestrictions: [], exportRequirements: [] });

    expect(sektor.getSektorState().status).toEqual("Done");
  });

  it("is Done when some imports, no restrictions, no requirements", () => {
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], statusDefinitions, { importRestrictions: [], exportRequirements: [] });
    sektor.createBuilding({ type: "Generator", location: { x: 0, y: 0 } });

    expect(sektor.getSektorState().status).toEqual("Done");
  });

  it("is RestrictionsExceeded when an import is greater than its restriction, no requirements", () => {
    const sektor = new Sektor([[{ properties: {} }]], statusDefinitions, {
      importRestrictions: [{ name: "Coal", value: 3 }],
      exportRequirements: [],
    });
    sektor.createBuilding({ type: "Generator", location: { x: 0, y: 0 } });

    expect(sektor.getSektorState().status).toEqual("RestrictionsExceeded");
  });

  it("is Done when an import is non-zero but less than its restriction, no requirements", () => {
    const sektor = new Sektor([[{ properties: {} }]], statusDefinitions, {
      importRestrictions: [{ name: "Coal", value: 8 }],
      exportRequirements: [],
    });
    sektor.createBuilding({ type: "Generator", location: { x: 0, y: 0 } });

    expect(sektor.getSektorState().status).toEqual("Done");
  });

  it("is Done when an import is equal to its restriction, no requirements", () => {
    const sektor = new Sektor([[{ properties: {} }]], statusDefinitions, {
      importRestrictions: [{ name: "Coal", value: 5 }],
      exportRequirements: [],
    });
    sektor.createBuilding({ type: "Generator", location: { x: 0, y: 0 } });

    expect(sektor.getSektorState().status).toEqual("Done");
  });

  it("is InProgress when no restrictions, all exports less than requirements", () => {
    const sektor = new Sektor([[{ properties: {} }]], statusDefinitions, {
      importRestrictions: [],
      exportRequirements: [{ name: "Power", value: 15 }],
    });
    sektor.createBuilding({ type: "Generator", location: { x: 0, y: 0 } });

    expect(sektor.getSektorState().status).toEqual("InProgress");
  });

  it("is Done when no restrictions, all exports equal or greater than requirements", () => {
    const sektor = new Sektor([[{ properties: {} }]], statusDefinitions, {
      importRestrictions: [],
      exportRequirements: [{ name: "Power", value: 10 }],
    });
    sektor.createBuilding({ type: "Generator", location: { x: 0, y: 0 } });

    expect(sektor.getSektorState().status).toEqual("Done");
  });

  it("is RestrictionsExceeded even if all exports meet requirements", () => {
    const sektor = new Sektor([[{ properties: {} }]], statusDefinitions, {
      importRestrictions: [{ name: "Coal", value: 3 }],
      exportRequirements: [{ name: "Power", value: 10 }],
    });
    sektor.createBuilding({ type: "Generator", location: { x: 0, y: 0 } });

    expect(sektor.getSektorState().status).toEqual("RestrictionsExceeded");
  });
});

const modifierDefinitions: BuildingDefinition[] = [
  {
    name: "SolarFarm",
    renderingCode: "box s(1,1,1)",
    buildingFunction: {
      inputs: [
        { name: "Work", value: 2 },
      ],
      outputs: [
        { name: "Energy", value: 10 },
      ],
    },
    outputModifiers: [
      { resource: "Energy", property: "insolation" },
    ],
    properties: {},
  },
  {
    name: "Mine",
    renderingCode: "box s(1,1,1)",
    buildingFunction: {
      inputs: [
        { name: "Energy", value: 3 },
      ],
      outputs: [
        { name: "Ore", value: 5 },
      ],
    },
    outputModifiers: [],
    properties: {},
  },
];

describe("output modifiers", () => {
  it("adds location property value to output when modifier is present", () => {
    const sektor = new Sektor(
      [[{ properties: { insolation: 3 } }]],
      modifierDefinitions,
      { importRestrictions: [], exportRequirements: [] },
    );
    sektor.createBuilding({ type: "SolarFarm", location: { x: 0, y: 0 } });

    expect(sektor.getSektorState().exports).toEqual([
      { name: "Energy", value: 13 },
    ]);
  });

  it("clamps modified output to minimum of 0", () => {
    const sektor = new Sektor(
      [[{ properties: { insolation: -6 } }]],
      modifierDefinitions,
      { importRestrictions: [], exportRequirements: [] },
    );
    sektor.createBuilding({ type: "SolarFarm", location: { x: 0, y: 0 } });

    expect(sektor.getSektorState().exports).toEqual([
      { name: "Energy", value: 4 },
    ]);
  });

  it("uses unmodified output when no modifier is present", () => {
    const sektor = new Sektor(
      [[{ properties: { insolation: 3 } }]],
      modifierDefinitions,
      { importRestrictions: [], exportRequirements: [] },
    );
    sektor.createBuilding({ type: "Mine", location: { x: 0, y: 0 } });

    expect(sektor.getSektorState().exports).toEqual([
      { name: "Ore", value: 5 },
    ]);
  });

  it("modified output is pooled with the other buildings' inputs and outputs", () => {
    const sektor = new Sektor(
      [[{ properties: { insolation: -4 } }, { properties: { insolation: -4 } }]],
      modifierDefinitions,
      { importRestrictions: [], exportRequirements: [] },
    );
    sektor.loadState({
      buildings: [
        { type: "SolarFarm", location: { x: 0, y: 0 } },
        { type: "Mine", location: { x: 0, y: 1 } },
      ],
    });

    expect(sektor.getSektorState()).toEqual({
      imports: [
        { name: "Work", value: 2 },
        { name: "Energy", value: 0 },
      ],
      exports: [
        { name: "Energy", value: 3 },
        { name: "Ore", value: 5 },
      ],
      status: "Done",
      importRestrictions: [],
      exportRequirements: [],
    });
  });
});
