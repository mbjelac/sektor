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
  {
    name: "Well",
    renderingCode: "box s(1,1,1)",
    buildingFunction: {
      inputs: [],
      outputs: [{ name: "Water", value: 4 }],
    },
    outputModifiers: [],
    boosters: [],
    properties: {},
  },
];

describe("getPossibleConnectionsForInput", () => {
  it("returns buildings that have an output matching the resource type", () => {
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, { importRestrictions: [], exportRequirements: [] });
    sektor.loadState({
      buildings: [
        { type: "Mill", location: { x: 0, y: 0 } },
        { type: "Farm", location: { x: 1, y: 0 } },
      ],
      connections: [],
    });

    const result = sektor.getPossibleConnectionsForInput({ x: 0, y: 0 }, "Wheat");

    expect(result).toEqual([{ location: { x: 1, y: 0 }, totalOutput: 5, remainingOutput: 5 }]);
  });

  it("excludes the target building itself", () => {
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, { importRestrictions: [], exportRequirements: [] });
    sektor.createBuilding({ type: "Farm", location: { x: 2, y: 3 } });

    const result = sektor.getPossibleConnectionsForInput({ x: 2, y: 3 }, "Wheat");

    expect(result).toEqual([]);
  });

  it("returns empty array when no buildings have matching output", () => {
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, { importRestrictions: [], exportRequirements: [] });
    sektor.loadState({
      buildings: [
        { type: "Mill", location: { x: 0, y: 0 } },
        { type: "Well", location: { x: 1, y: 0 } },
      ],
      connections: [],
    });

    const result = sektor.getPossibleConnectionsForInput({ x: 0, y: 0 }, "Wheat");

    expect(result).toEqual([]);
  });

  it("excludes buildings with depleted output", () => {
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, { importRestrictions: [], exportRequirements: [] });
    sektor.loadState({
      buildings: [
        { type: "Farm", location: { x: 0, y: 0 } },
        { type: "Farm", location: { x: 1, y: 0 } },
        { type: "Farm", location: { x: 2, y: 0 } },
        { type: "Farm", location: { x: 3, y: 0 } },
        { type: "Farm", location: { x: 4, y: 0 } },
        { type: "Well", location: { x: 5, y: 0 } },
      ],
      connections: [],
    });

    // Well has Water output 4, deplete it with 4 connections
    sektor.addConnection({ x: 0, y: 0 }, { x: 5, y: 0 }, "Water");
    sektor.addConnection({ x: 1, y: 0 }, { x: 5, y: 0 }, "Water");
    sektor.addConnection({ x: 2, y: 0 }, { x: 5, y: 0 }, "Water");
    sektor.addConnection({ x: 3, y: 0 }, { x: 5, y: 0 }, "Water");

    const result = sektor.getPossibleConnectionsForInput({ x: 4, y: 0 }, "Water");

    expect(result).toEqual([]);
  });

  it("excludes buildings already connected to target with same resource type", () => {
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, { importRestrictions: [], exportRequirements: [] });
    sektor.loadState({
      buildings: [
        { type: "Mill", location: { x: 0, y: 0 } },
        { type: "Farm", location: { x: 1, y: 0 } },
        { type: "Farm", location: { x: 2, y: 0 } },
      ],
      connections: [],
    });

    sektor.addConnection({ x: 0, y: 0 }, { x: 1, y: 0 }, "Wheat");

    const result = sektor.getPossibleConnectionsForInput({ x: 0, y: 0 }, "Wheat");

    expect(result).toEqual([
      { location: { x: 2, y: 0 }, totalOutput: 5, remainingOutput: 5 },
    ]);
  });

  it("returns multiple buildings when several have matching output", () => {
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, { importRestrictions: [], exportRequirements: [] });
    sektor.loadState({
      buildings: [
        { type: "Mill", location: { x: 0, y: 0 } },
        { type: "Farm", location: { x: 1, y: 0 } },
        { type: "Farm", location: { x: 2, y: 0 } },
      ],
      connections: [],
    });

    const result = sektor.getPossibleConnectionsForInput({ x: 0, y: 0 }, "Wheat");

    expect(result).toEqual([
      { location: { x: 1, y: 0 }, totalOutput: 5, remainingOutput: 5 },
      { location: { x: 2, y: 0 }, totalOutput: 5, remainingOutput: 5 },
    ]);
  });
});
