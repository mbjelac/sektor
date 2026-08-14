import { describe, it, expect } from "vitest";
import { Sektor } from "./Sektor";
import { BuildingDefinition } from "./buildings/parseBuildingDefinitions";

function buildingDefinition(name: string, inputs: { name: string, value: number }[], outputs: { name: string, value: number }[]): BuildingDefinition {
  return {
    name,
    renderingCode: "box s(1,1,1)",
    buildingFunction: { inputs, outputs },
    outputModifiers: [],
    boosters: [],
    properties: {},
  };
}

const testDefinitions: BuildingDefinition[] = [
  buildingDefinition("Mill", [{ name: "Wheat", value: 4 }], [{ name: "Flour", value: 3 }]),
  buildingDefinition("Well", [], [{ name: "Water", value: 1 }]),
  buildingDefinition("WheatFarm", [], [{ name: "Wheat", value: 1 }]),
  buildingDefinition("Homestead", [], [{ name: "Water", value: 1 }, { name: "Wheat", value: 1 }]),
  buildingDefinition("WaterTower", [{ name: "Water", value: 1 }], []),
  buildingDefinition("Silo", [{ name: "Wheat", value: 1 }], []),
  buildingDefinition("Bakery", [{ name: "Water", value: 1 }, { name: "Wheat", value: 1 }], []),
  buildingDefinition("Quarry", [], [{ name: "Stone", value: 1 }]),
  buildingDefinition("SmallWell", [], [{ name: "Water", value: 2 }]),
  buildingDefinition("BigWell", [], [{ name: "Water", value: 5 }]),
  buildingDefinition("BigWaterTower", [{ name: "Water", value: 3 }], []),
  buildingDefinition("HugeWaterTower", [{ name: "Water", value: 5 }], []),
];

function createSektor(): Sektor {
  return new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, { importRestrictions: [], exportRequirements: [] });
}

describe("createBuilding", () => {
  it("creates building on free location", () => {
    const sektor = createSektor();

    const result = sektor.createBuilding({ type: "Mill", location: { x: 8, y: 6 } });

    expect(result).toEqual({
      error: undefined,
      addedBuildings: [{ type: "Mill", location: { x: 8, y: 6 } }],
      incomingConnections: [],
      outgoingConnections: [],
    });
  });

  it("does not create building on occupied location", () => {
    const sektor = createSektor();

    sektor.createBuilding({ type: "Mill", location: { x: 8, y: 6 } });
    const result = sektor.createBuilding({ type: "Mill", location: { x: 8, y: 6 } });

    expect(result).toEqual({
      error: "locationOccupied",
      addedBuildings: [],
      incomingConnections: [],
      outgoingConnections: [],
    });
  });
});

describe("createBuilding automatic connections", () => {
  it("connects nothing when no buildings exist", () => {
    const sektor = createSektor();

    const result = sektor.createBuilding({ type: "Bakery", location: { x: 0, y: 0 } });

    expect({
      incomingConnections: result.incomingConnections,
      outgoingConnections: result.outgoingConnections,
      connections: sektor.getState().connections,
    }).toEqual({
      incomingConnections: [],
      outgoingConnections: [],
      connections: [],
    });
  });

  it("connects nothing when existing buildings have no matching inputs or outputs", () => {
    const sektor = createSektor();
    sektor.createBuilding({ type: "Quarry", location: { x: 0, y: 0 } });

    const result = sektor.createBuilding({ type: "WaterTower", location: { x: 1, y: 0 } });

    expect({
      incomingConnections: result.incomingConnections,
      outgoingConnections: result.outgoingConnections,
      connections: sektor.getState().connections,
    }).toEqual({
      incomingConnections: [],
      outgoingConnections: [],
      connections: [],
    });
  });

  it("connects nothing when matching inputs and outputs are already connected with maximum amounts", () => {
    const sektor = createSektor();
    sektor.createBuilding({ type: "Well", location: { x: 0, y: 0 } });
    sektor.createBuilding({ type: "WaterTower", location: { x: 1, y: 0 } });

    const result = sektor.createBuilding({ type: "WaterTower", location: { x: 2, y: 0 } });

    expect({
      incomingConnections: result.incomingConnections,
      outgoingConnections: result.outgoingConnections,
      connections: sektor.getState().connections,
    }).toEqual({
      incomingConnections: [],
      outgoingConnections: [],
      connections: [
        { target: { x: 1, y: 0 }, source: { x: 0, y: 0 }, resourceType: "Water", amount: 1 },
      ],
    });
  });

  it("connects one input to an existing building's output", () => {
    const sektor = createSektor();
    sektor.createBuilding({ type: "Well", location: { x: 0, y: 0 } });

    const result = sektor.createBuilding({ type: "WaterTower", location: { x: 1, y: 0 } });

    expect({
      incomingConnections: result.incomingConnections,
      outgoingConnections: result.outgoingConnections,
      connections: sektor.getState().connections,
    }).toEqual({
      incomingConnections: [{ to: { x: 0, y: 0 }, resourceType: "Water", amount: 1 }],
      outgoingConnections: [],
      connections: [
        { target: { x: 1, y: 0 }, source: { x: 0, y: 0 }, resourceType: "Water", amount: 1 },
      ],
    });
  });

  it("connects one output to an existing building's input", () => {
    const sektor = createSektor();
    sektor.createBuilding({ type: "WaterTower", location: { x: 0, y: 0 } });

    const result = sektor.createBuilding({ type: "Well", location: { x: 1, y: 0 } });

    expect({
      incomingConnections: result.incomingConnections,
      outgoingConnections: result.outgoingConnections,
      connections: sektor.getState().connections,
    }).toEqual({
      incomingConnections: [],
      outgoingConnections: [{ to: { x: 0, y: 0 }, resourceType: "Water", amount: 1 }],
      connections: [
        { target: { x: 0, y: 0 }, source: { x: 1, y: 0 }, resourceType: "Water", amount: 1 },
      ],
    });
  });

  it("connects multiple inputs to multiple existing buildings' outputs", () => {
    const sektor = createSektor();
    sektor.createBuilding({ type: "Well", location: { x: 0, y: 0 } });
    sektor.createBuilding({ type: "WheatFarm", location: { x: 1, y: 0 } });

    const result = sektor.createBuilding({ type: "Bakery", location: { x: 2, y: 0 } });

    expect({
      incomingConnections: result.incomingConnections,
      outgoingConnections: result.outgoingConnections,
      connections: sektor.getState().connections,
    }).toEqual({
      incomingConnections: [
        { to: { x: 0, y: 0 }, resourceType: "Water", amount: 1 },
        { to: { x: 1, y: 0 }, resourceType: "Wheat", amount: 1 },
      ],
      outgoingConnections: [],
      connections: [
        { target: { x: 2, y: 0 }, source: { x: 0, y: 0 }, resourceType: "Water", amount: 1 },
        { target: { x: 2, y: 0 }, source: { x: 1, y: 0 }, resourceType: "Wheat", amount: 1 },
      ],
    });
  });

  it("connects multiple outputs to multiple existing buildings' inputs", () => {
    const sektor = createSektor();
    sektor.createBuilding({ type: "WaterTower", location: { x: 0, y: 0 } });
    sektor.createBuilding({ type: "Silo", location: { x: 1, y: 0 } });

    const result = sektor.createBuilding({ type: "Homestead", location: { x: 2, y: 0 } });

    expect({
      incomingConnections: result.incomingConnections,
      outgoingConnections: result.outgoingConnections,
      connections: sektor.getState().connections,
    }).toEqual({
      incomingConnections: [],
      outgoingConnections: [
        { to: { x: 0, y: 0 }, resourceType: "Water", amount: 1 },
        { to: { x: 1, y: 0 }, resourceType: "Wheat", amount: 1 },
      ],
      connections: [
        { target: { x: 0, y: 0 }, source: { x: 2, y: 0 }, resourceType: "Water", amount: 1 },
        { target: { x: 1, y: 0 }, source: { x: 2, y: 0 }, resourceType: "Wheat", amount: 1 },
      ],
    });
  });

  it("connects one input to the outputs of multiple existing buildings until that input is filled", () => {
    const sektor = createSektor();
    sektor.createBuilding({ type: "SmallWell", location: { x: 1, y: 0 } });
    sektor.createBuilding({ type: "BigWell", location: { x: 3, y: 0 } });

    const result = sektor.createBuilding({ type: "HugeWaterTower", location: { x: 0, y: 0 } });

    expect({
      incomingConnections: result.incomingConnections,
      outgoingConnections: result.outgoingConnections,
      connections: sektor.getState().connections,
    }).toEqual({
      incomingConnections: [
        { to: { x: 1, y: 0 }, resourceType: "Water", amount: 2 },
        { to: { x: 3, y: 0 }, resourceType: "Water", amount: 3 },
      ],
      outgoingConnections: [],
      connections: [
        { target: { x: 0, y: 0 }, source: { x: 1, y: 0 }, resourceType: "Water", amount: 2 },
        { target: { x: 0, y: 0 }, source: { x: 3, y: 0 }, resourceType: "Water", amount: 3 },
      ],
    });
  });

  it("connects one output to the inputs of multiple existing buildings until that output is used up", () => {
    const sektor = createSektor();
    sektor.createBuilding({ type: "BigWaterTower", location: { x: 1, y: 0 } });
    sektor.createBuilding({ type: "BigWaterTower", location: { x: 2, y: 0 } });

    const result = sektor.createBuilding({ type: "BigWell", location: { x: 0, y: 0 } });

    expect({
      incomingConnections: result.incomingConnections,
      outgoingConnections: result.outgoingConnections,
      connections: sektor.getState().connections,
    }).toEqual({
      incomingConnections: [],
      outgoingConnections: [
        { to: { x: 1, y: 0 }, resourceType: "Water", amount: 3 },
        { to: { x: 2, y: 0 }, resourceType: "Water", amount: 2 },
      ],
      connections: [
        { target: { x: 1, y: 0 }, source: { x: 0, y: 0 }, resourceType: "Water", amount: 3 },
        { target: { x: 2, y: 0 }, source: { x: 0, y: 0 }, resourceType: "Water", amount: 2 },
      ],
    });
  });

  it("connects an input to the output of the closer of two existing buildings", () => {
    const sektor = createSektor();
    sektor.createBuilding({ type: "Well", location: { x: 5, y: 0 } });
    sektor.createBuilding({ type: "Well", location: { x: 1, y: 1 } });

    const result = sektor.createBuilding({ type: "WaterTower", location: { x: 0, y: 0 } });

    expect({
      incomingConnections: result.incomingConnections,
      outgoingConnections: result.outgoingConnections,
      connections: sektor.getState().connections,
    }).toEqual({
      incomingConnections: [{ to: { x: 1, y: 1 }, resourceType: "Water", amount: 1 }],
      outgoingConnections: [],
      connections: [
        { target: { x: 0, y: 0 }, source: { x: 1, y: 1 }, resourceType: "Water", amount: 1 },
      ],
    });
  });

  it("connects with the amount of the available output when the output is smaller than the input", () => {
    const sektor = createSektor();
    sektor.createBuilding({ type: "SmallWell", location: { x: 0, y: 0 } });

    const result = sektor.createBuilding({ type: "BigWaterTower", location: { x: 1, y: 0 } });

    expect({
      incomingConnections: result.incomingConnections,
      outgoingConnections: result.outgoingConnections,
      connections: sektor.getState().connections,
    }).toEqual({
      incomingConnections: [{ to: { x: 0, y: 0 }, resourceType: "Water", amount: 2 }],
      outgoingConnections: [],
      connections: [
        { target: { x: 1, y: 0 }, source: { x: 0, y: 0 }, resourceType: "Water", amount: 2 },
      ],
    });
  });

  it("connects with the amount of the available input when the input is smaller than the output", () => {
    const sektor = createSektor();
    sektor.createBuilding({ type: "BigWell", location: { x: 0, y: 0 } });

    const result = sektor.createBuilding({ type: "BigWaterTower", location: { x: 1, y: 0 } });

    expect({
      incomingConnections: result.incomingConnections,
      outgoingConnections: result.outgoingConnections,
      connections: sektor.getState().connections,
    }).toEqual({
      incomingConnections: [{ to: { x: 0, y: 0 }, resourceType: "Water", amount: 3 }],
      outgoingConnections: [],
      connections: [
        { target: { x: 1, y: 0 }, source: { x: 0, y: 0 }, resourceType: "Water", amount: 3 },
      ],
    });
  });

  it("connects with the amount of the remaining output when part of the output is already connected", () => {
    const sektor = createSektor();
    sektor.createBuilding({ type: "BigWell", location: { x: 0, y: 0 } });
    sektor.createBuilding({ type: "BigWaterTower", location: { x: 1, y: 0 } });

    const result = sektor.createBuilding({ type: "BigWaterTower", location: { x: 2, y: 0 } });

    expect({
      incomingConnections: result.incomingConnections,
      outgoingConnections: result.outgoingConnections,
      connections: sektor.getState().connections,
    }).toEqual({
      incomingConnections: [{ to: { x: 0, y: 0 }, resourceType: "Water", amount: 2 }],
      outgoingConnections: [],
      connections: [
        { target: { x: 1, y: 0 }, source: { x: 0, y: 0 }, resourceType: "Water", amount: 3 },
        { target: { x: 2, y: 0 }, source: { x: 0, y: 0 }, resourceType: "Water", amount: 2 },
      ],
    });
  });

  it("connects an output to the input of the closer of two existing buildings", () => {
    const sektor = createSektor();
    sektor.createBuilding({ type: "WaterTower", location: { x: 5, y: 0 } });
    sektor.createBuilding({ type: "WaterTower", location: { x: 1, y: 1 } });

    const result = sektor.createBuilding({ type: "Well", location: { x: 0, y: 0 } });

    expect({
      incomingConnections: result.incomingConnections,
      outgoingConnections: result.outgoingConnections,
      connections: sektor.getState().connections,
    }).toEqual({
      incomingConnections: [],
      outgoingConnections: [{ to: { x: 1, y: 1 }, resourceType: "Water", amount: 1 }],
      connections: [
        { target: { x: 1, y: 1 }, source: { x: 0, y: 0 }, resourceType: "Water", amount: 1 },
      ],
    });
  });
});
