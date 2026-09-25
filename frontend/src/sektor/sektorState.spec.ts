import { describe, it, expect } from "vitest";
import { Sektor } from "./Sektor";
import { BuildingDefinition } from "./buildings/parseBuildingDefinitions";

const testDefinitions: BuildingDefinition[] = [
  {
    name: "Well",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{
      inputs: [
        { name: "Energy", value: 8 },
        { name: "Work", value: 3 },
      ],
      outputs: [
        { name: "Water", value: 4 },
      ],
    }],
    properties: {},
  },
  {
    name: "Farm",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{
      inputs: [
        { name: "Water", value: 3 },
        { name: "Energy", value: 1 },
        { name: "Work", value: 5 },
      ],
      outputs: [
        { name: "Food", value: 5 },
      ],
    }],
    properties: {},
  },
];

describe("getSektorState", () => {
  it("returns empty imports and exports when there are no buildings", () => {
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, []);

    const result = sektor.getSektorState();

    expect(result).toEqual({
      imports: [],
      exports: [],
      hapiness: 0,
      possibleHapiness: 0,
      habitatShortages: [],
      starvedFunctions: [],
    });
  });

  it("returns imports and exports for a single building", () => {
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, []);
    sektor.loadState({ buildings: [{ type: "Well", location: { x: 0, y: 0 } }] });

    const result = sektor.getSektorState();

    expect(result).toEqual({
      imports: [
        { name: "Energy", value: 8 },
        { name: "Work", value: 3 },
      ],
      exports: [
        { name: "Water", value: 4 },
      ],
      hapiness: 0,
      possibleHapiness: 0,
      habitatShortages: [],
      starvedFunctions: [],
    });
  });

  it("aggregates imports and exports by resource name across buildings", () => {
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, []);
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
      hapiness: 0,
      possibleHapiness: 0,
      habitatShortages: [],
      starvedFunctions: [],
    });
  });
});

const poolDefinitions: BuildingDefinition[] = [
  {
    name: "Consumer",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{
      inputs: [{ name: "Water", value: 5 }],
      outputs: [],
    }],
    properties: {},
  },
  {
    name: "Producer",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{
      inputs: [],
      outputs: [{ name: "Water", value: 7 }],
    }],
    properties: {},
  },
  {
    name: "BigProducer",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{
      inputs: [],
      outputs: [{ name: "Water", value: 10 }],
    }],
    properties: {},
  },
];

describe("resource pool", () => {
  it("imports the amount by which inputs exceed outputs", () => {
    const sektor = new Sektor([[{ properties: {} }]], poolDefinitions, []);
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
    const sektor = new Sektor([[{ properties: {} }]], poolDefinitions, []);
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
    const sektor = new Sektor([[{ properties: {} }]], poolDefinitions, []);
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
    const sektor = new Sektor([[{ properties: {} }]], poolDefinitions, []);
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

const locationPropertyDefinitions: BuildingDefinition[] = [
  {
    name: "SolarFarm",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{
      inputs: [
        { name: "Work", value: 2 },
      ],
      outputs: [
        { name: "Energy", locationProperty: "insolation" },
      ],
    }],
    properties: {},
  },
  {
    name: "Mine",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{
      inputs: [
        { name: "Energy", value: 3 },
      ],
      outputs: [
        { name: "Ore", value: 5 },
      ],
    }],
    properties: {},
  },
];

describe("outputs named after a location property", () => {
  it("produces the location property value as the output amount", () => {
    const sektor = new Sektor(
      [[{ properties: { insolation: 3 } }]],
      locationPropertyDefinitions,
      [],
    );
    sektor.loadState({ buildings: [{ type: "SolarFarm", location: { x: 0, y: 0 } }] });

    expect(sektor.getSektorState().exports).toEqual([
      { name: "Energy", value: 3 },
    ]);
  });

  it("produces nothing where the location has none of the property", () => {
    const sektor = new Sektor(
      [[{ properties: { insolation: 0 } }]],
      locationPropertyDefinitions,
      [],
    );
    sektor.loadState({ buildings: [{ type: "SolarFarm", location: { x: 0, y: 0 } }] });

    expect(sektor.getSektorState().exports).toEqual([
      { name: "Energy", value: 0 },
    ]);
  });

  it("produces the written amount when the output names no location property", () => {
    const sektor = new Sektor(
      [[{ properties: { insolation: 3 } }]],
      locationPropertyDefinitions,
      [],
    );
    sektor.loadState({ buildings: [{ type: "Mine", location: { x: 0, y: 0 } }] });

    expect(sektor.getSektorState().exports).toEqual([
      { name: "Ore", value: 5 },
    ]);
  });

  it("pools the produced amount with the other buildings' inputs and outputs", () => {
    const sektor = new Sektor(
      [[{ properties: { insolation: 4 } }, { properties: { insolation: 4 } }]],
      locationPropertyDefinitions,
      [],
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
        { name: "Energy", value: 1 },
        { name: "Ore", value: 5 },
      ],
      hapiness: 0,
      possibleHapiness: 0,
      habitatShortages: [],
      starvedFunctions: [],
    });
  });
});
