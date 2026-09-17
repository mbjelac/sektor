import { describe, it, expect } from "vitest";
import { Sektor } from "./Sektor";
import { BuildingDefinition } from "./buildings/parseBuildingDefinitions";
import { negativeScoringResourceNames, parseResources } from "../parseResources";
import testResourcesMd from "../assets/resources.test.md?raw";

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
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, [], []);

    const result = sektor.getSektorState();

    expect(result).toEqual({
      imports: [],
      exports: [],
      starvedFunctions: [],
    });
  });

  it("returns imports and exports for a single building", () => {
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, [], []);
    sektor.loadState({ buildings: [{ type: "Well", location: { x: 0, y: 0 } }] });

    const result = sektor.getSektorState();

    expect(result).toEqual({
      imports: [
        { name: "Energy", value: 8, score: -16 },
        { name: "Work", value: 3, score: -6 },
      ],
      exports: [
        { name: "Water", value: 4, score: 8 },
      ],
      starvedFunctions: [],
    });
  });

  it("aggregates imports and exports by resource name across buildings", () => {
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, [], []);
    sektor.loadState({
      buildings: [
        { type: "Well", location: { x: 0, y: 0 } },
        { type: "Farm", location: { x: 1, y: 0 } },
      ],
    });

    const result = sektor.getSektorState();

    expect(result).toEqual({
      imports: [
        { name: "Energy", value: 9, score: -18 },
        { name: "Work", value: 8, score: -16 },
        { name: "Water", value: 0, score: 0 },
      ],
      exports: [
        { name: "Water", value: 1, score: 2 },
        { name: "Food", value: 5, score: 10 },
      ],
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
    const sektor = new Sektor([[{ properties: {} }]], poolDefinitions, [], []);
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
      imports: [{ name: "Water", value: 3, score: -6 }],
      exports: [{ name: "Water", value: 0, score: 0 }],
    });
  });

  it("exports the amount by which outputs exceed inputs", () => {
    const sektor = new Sektor([[{ properties: {} }]], poolDefinitions, [], []);
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
      imports: [{ name: "Water", value: 0, score: 0 }],
      exports: [{ name: "Water", value: 2, score: 4 }],
    });
  });

  it("neither imports nor exports when outputs equal inputs", () => {
    const sektor = new Sektor([[{ properties: {} }]], poolDefinitions, [], []);
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
      imports: [{ name: "Water", value: 0, score: 0 }],
      exports: [{ name: "Water", value: 0, score: 0 }],
    });
  });

  it("exports the freed amount when a consuming building is destroyed", () => {
    const sektor = new Sektor([[{ properties: {} }]], poolDefinitions, [], []);
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
      imports: [{ name: "Water", value: 0, score: 0 }],
      exports: [{ name: "Water", value: 5, score: 10 }],
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
      [],
    );
    sektor.loadState({ buildings: [{ type: "SolarFarm", location: { x: 0, y: 0 } }] });

    expect(sektor.getSektorState().exports).toEqual([
      { name: "Energy", value: 3, score: 6 },
    ]);
  });

  it("produces nothing where the location has none of the property", () => {
    const sektor = new Sektor(
      [[{ properties: { insolation: 0 } }]],
      locationPropertyDefinitions,
      [],
      [],
    );
    sektor.loadState({ buildings: [{ type: "SolarFarm", location: { x: 0, y: 0 } }] });

    expect(sektor.getSektorState().exports).toEqual([
      { name: "Energy", value: 0, score: 0 },
    ]);
  });

  it("produces the written amount when the output names no location property", () => {
    const sektor = new Sektor(
      [[{ properties: { insolation: 3 } }]],
      locationPropertyDefinitions,
      [],
      [],
    );
    sektor.loadState({ buildings: [{ type: "Mine", location: { x: 0, y: 0 } }] });

    expect(sektor.getSektorState().exports).toEqual([
      { name: "Ore", value: 5, score: 10 },
    ]);
  });

  it("pools the produced amount with the other buildings' inputs and outputs", () => {
    const sektor = new Sektor(
      [[{ properties: { insolation: 4 } }, { properties: { insolation: 4 } }]],
      locationPropertyDefinitions,
      [],
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
        { name: "Work", value: 2, score: -4 },
        { name: "Energy", value: 0, score: 0 },
      ],
      exports: [
        { name: "Energy", value: 1, score: 2 },
        { name: "Ore", value: 5, score: 10 },
      ],
      starvedFunctions: [],
    });
  });
});

const scoringDefinitions: BuildingDefinition[] = [
  {
    name: "EnergyConsumer",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{
      inputs: [{ name: "Energy", value: 17 }],
      outputs: [],
    }],
    properties: {},
  },
  {
    name: "BigFoodProducer",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{
      inputs: [],
      outputs: [{ name: "Food", value: 17 }],
    }],
    properties: {},
  },
  {
    name: "WorkConsumer",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{
      inputs: [{ name: "Work", value: 6 }],
      outputs: [],
    }],
    properties: {},
  },
  {
    name: "WorkProducer",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{
      inputs: [],
      outputs: [{ name: "Work", value: 6 }],
    }],
    properties: {},
  },
];

// "Work" is marked as negatively scored in resources.test.md
const negativeScoringResources = negativeScoringResourceNames(parseResources(testResourcesMd.split("\n")));

describe("scoring", () => {
  it("scores each imported unit -2", () => {
    const sektor = new Sektor([[{ properties: {} }]], scoringDefinitions, negativeScoringResources, []);
    sektor.loadState({ buildings: [{ type: "EnergyConsumer", location: { x: 0, y: 0 } }] });

    expect(sektor.getSektorState().imports).toEqual([{ name: "Energy", value: 17, score: -34 }]);
  });

  it("scores each exported unit +2", () => {
    const sektor = new Sektor([[{ properties: {} }]], scoringDefinitions, negativeScoringResources, []);
    sektor.loadState({ buildings: [{ type: "BigFoodProducer", location: { x: 0, y: 0 } }] });

    expect(sektor.getSektorState().exports).toEqual([{ name: "Food", value: 17, score: 34 }]);
  });



  it("scores each imported unit of a negatively scored resource +2", () => {
    const sektor = new Sektor([[{ properties: {} }]], scoringDefinitions, negativeScoringResources, []);
    sektor.loadState({ buildings: [{ type: "WorkConsumer", location: { x: 0, y: 0 } }] });

    expect(sektor.getSektorState().imports).toEqual([{ name: "Work", value: 6, score: 12 }]);
  });

  it("scores each exported unit of a negatively scored resource -2", () => {
    const sektor = new Sektor([[{ properties: {} }]], scoringDefinitions, negativeScoringResources, []);
    sektor.loadState({ buildings: [{ type: "WorkProducer", location: { x: 0, y: 0 } }] });

    expect(sektor.getSektorState().exports).toEqual([{ name: "Work", value: 6, score: -12 }]);
  });

});
