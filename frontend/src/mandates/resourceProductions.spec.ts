import { describe, it, expect } from "vitest";
import { resourceProductions } from "./resourceProductions";
import { BuildingDefinition } from "../sektor/buildings/parseBuildingDefinitions";

function buildingOf(name: string, buildingFunctions: BuildingDefinition["buildingFunctions"]): BuildingDefinition {
  return { name, renderingCodes: [], buildingFunctions, properties: {} };
}

describe("resourceProductions", () => {
  it("lists every output of every building function with what the function takes in", () => {
    expect(resourceProductions([
      buildingOf("Weaver", [{
        inputs: [{ name: "Apples", value: 4 }],
        outputs: [{ name: "Cloth", value: 2 }, { name: "Scraps", value: 1 }],
      }]),
      buildingOf("Well", [{ inputs: [], outputs: [{ name: "Water", locationProperty: "groundwater" }] }]),
    ])).toEqual([
      { outputName: "Cloth", outputAmount: 2, inputs: [{ name: "Apples", value: 4 }] },
      { outputName: "Scraps", outputAmount: 1, inputs: [{ name: "Apples", value: 4 }] },
      { outputName: "Water", outputAmount: 1, inputs: [] },
    ]);
  });
});
