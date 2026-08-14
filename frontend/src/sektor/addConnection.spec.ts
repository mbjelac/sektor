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

describe("addConnection", () => {
  it("succeeds when target has matching input and source has matching output", () => {
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, { importRestrictions: [], exportRequirements: [] });
    sektor.loadState({
      buildings: [
        { type: "Mill", location: { x: 0, y: 0 } },
        { type: "Farm", location: { x: 1, y: 0 } },
      ],
      connections: [],
    });

    const result = sektor.addConnection({ x: 0, y: 0 }, { x: 1, y: 0 }, "Wheat");

    expect(result).toEqual({ success: true });
  });

  it("fails when target has no matching input", () => {
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, { importRestrictions: [], exportRequirements: [] });
    sektor.loadState({
      buildings: [
        { type: "Mill", location: { x: 0, y: 0 } },
        { type: "Well", location: { x: 1, y: 0 } },
      ],
      connections: [],
    });

    const result = sektor.addConnection({ x: 0, y: 0 }, { x: 1, y: 0 }, "Water");

    expect(result).toEqual({ success: false, error: "targetHasNoMatchingInput" });
  });

  it("fails when source has no matching output", () => {
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, { importRestrictions: [], exportRequirements: [] });
    sektor.loadState({
      buildings: [
        { type: "Farm", location: { x: 0, y: 0 } },
        { type: "Mill", location: { x: 1, y: 0 } },
      ],
      connections: [],
    });

    const result = sektor.addConnection({ x: 0, y: 0 }, { x: 1, y: 0 }, "Water");

    expect(result).toEqual({ success: false, error: "sourceHasNoMatchingOutput" });
  });

  it("fails when target import is exhausted", () => {
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, { importRestrictions: [], exportRequirements: [] });
    sektor.loadState({
      buildings: [
        { type: "Farm", location: { x: 0, y: 0 } },
        { type: "Well", location: { x: 1, y: 0 } },
        { type: "Well", location: { x: 2, y: 0 } },
        { type: "Well", location: { x: 3, y: 0 } },
      ],
      connections: [],
    });

    // Farm has Water input with value 2, so after 2 connections import is exhausted
    sektor.addConnection({ x: 0, y: 0 }, { x: 1, y: 0 }, "Water");
    sektor.addConnection({ x: 0, y: 0 }, { x: 2, y: 0 }, "Water");
    const result = sektor.addConnection({ x: 0, y: 0 }, { x: 3, y: 0 }, "Water");

    expect(result).toEqual({ success: false, error: "targetInputFull" });
  });

  it("fails when source export is exhausted", () => {
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, { importRestrictions: [], exportRequirements: [] });
    sektor.loadState({
      buildings: [
        { type: "Farm", location: { x: 0, y: 0 } },
        { type: "Farm", location: { x: 1, y: 0 } },
        { type: "Farm", location: { x: 2, y: 0 } },
        { type: "Farm", location: { x: 3, y: 0 } },
        { type: "Farm", location: { x: 4, y: 0 } },
        { type: "Farm", location: { x: 5, y: 0 } },
        { type: "Well", location: { x: 6, y: 0 } },
      ],
      connections: [],
    });

    // Well has Water output with value 4, so after 4 connections export is exhausted
    sektor.addConnection({ x: 0, y: 0 }, { x: 6, y: 0 }, "Water");
    sektor.addConnection({ x: 1, y: 0 }, { x: 6, y: 0 }, "Water");
    sektor.addConnection({ x: 2, y: 0 }, { x: 6, y: 0 }, "Water");
    sektor.addConnection({ x: 3, y: 0 }, { x: 6, y: 0 }, "Water");
    const result = sektor.addConnection({ x: 4, y: 0 }, { x: 6, y: 0 }, "Water");

    expect(result).toEqual({ success: false, error: "sourceOutputExhausted" });
  });

  it("fails when source is already connected to target with same resource type", () => {
    const sektor = new Sektor([[{ properties: { soil: 1.0 } }]], testDefinitions, { importRestrictions: [], exportRequirements: [] });
    sektor.loadState({
      buildings: [
        { type: "Mill", location: { x: 0, y: 0 } },
        { type: "Farm", location: { x: 1, y: 0 } },
      ],
      connections: [],
    });

    sektor.addConnection({ x: 0, y: 0 }, { x: 1, y: 0 }, "Wheat");
    const result = sektor.addConnection({ x: 0, y: 0 }, { x: 1, y: 0 }, "Wheat");

    expect(result).toEqual({ success: false, error: "alreadyConnected" });
  });
});
