import { describe, it, expect } from "vitest";
import { withoutUnproducibleMandates } from "./producibleMandates";
import { Mandate, MandateCriterion } from "./mandates.api";
import { BuildingDefinition } from "../sektor/buildings/parseBuildingDefinitions";

function mandateAsking(mandateNumber: number, criterion: MandateCriterion): Mandate {
  return { number: mandateNumber, owner: null, criteria: [criterion], completed: false };
}

function buildingMaking(name: string, inputNames: string[], outputNames: string[]): BuildingDefinition {
  return {
    name,
    renderingCodes: [],
    buildingFunctions: [{
      inputs: inputNames.map(inputName => ({ name: inputName, value: 1 })),
      outputs: outputNames.map(outputName => ({ name: outputName, value: 1 })),
    }],
    properties: {},
  };
}

// The orchard makes Apples out of Water; the dump takes in Sludge. Nothing makes Pears, nothing takes
// in Smoke, and no building gives off Hapiness.
const AVAILABLE_BUILDINGS = [
  buildingMaking("Orchard", ["Water"], ["Apples"]),
  buildingMaking("Dump", ["Sludge"], []),
];

describe("withoutUnproducibleMandates", () => {
  it("leaves out the mandates asking for what no available building makes or takes in", () => {
    expect(withoutUnproducibleMandates([
      mandateAsking(1, { type: "minimumExport", resourceName: "Apples", amount: 5, completed: false }),
      mandateAsking(2, { type: "minimumExport", resourceName: "Pears", amount: 5, completed: false }),
      mandateAsking(3, { type: "minimumImport", resourceName: "Sludge", amount: 5, completed: false }),
      mandateAsking(4, { type: "minimumImport", resourceName: "Smoke", amount: 5, completed: false }),
    ], AVAILABLE_BUILDINGS).map(mandate => mandate.number)).toEqual([1, 3]);
  });

  it("leaves out the mandates asking for people or Hapiness while no available building gives off Hapiness", () => {
    expect([
      withoutUnproducibleMandates([
        mandateAsking(1, { type: "minimumPopulation", amount: 40, completed: false }),
        mandateAsking(2, { type: "minimumHapiness", amount: 3, completed: false }),
      ], AVAILABLE_BUILDINGS).map(mandate => mandate.number),
      withoutUnproducibleMandates([
        mandateAsking(1, { type: "minimumPopulation", amount: 40, completed: false }),
        mandateAsking(2, { type: "minimumHapiness", amount: 3, completed: false }),
      ], [...AVAILABLE_BUILDINGS, buildingMaking("Home", ["Apples"], ["Hapiness"])]).map(mandate => mandate.number),
    ]).toEqual([[], [1, 2]]);
  });

  it("keeps the mandates asking for at most, whatever the available buildings make", () => {
    expect(withoutUnproducibleMandates([
      mandateAsking(1, { type: "maximumPollution", amount: 100, completed: false }),
      mandateAsking(2, { type: "maximumDeforestation", amount: 10, completed: false }),
      mandateAsking(3, { type: "maximumPopulation", amount: 0, completed: false }),
      mandateAsking(4, { type: "maximumExport", resourceName: "Pears", amount: 5, completed: false }),
      mandateAsking(5, { type: "maximumImport", resourceName: "Smoke", amount: 5, completed: false }),
    ], []).map(mandate => mandate.number)).toEqual([1, 2, 3, 4, 5]);
  });
});
