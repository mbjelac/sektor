import { describe, it, expect } from "vitest";
import { Sektor } from "./Sektor";
import { BuildingDefinition } from "./buildings/parseBuildingDefinitions";
import { buildingVariantNumber, randomVariantIndex } from "./buildings/buildingVariant";

const testDefinitions: BuildingDefinition[] = [{
  name: "Park",
  renderingCodes: ["box s(1,1,1)", "cyl s(1,1,1)", "pri4 s(1,1,1)"],
  buildingFunctions: [{ inputs: [], outputs: [{ name: "Happiness", value: 1 }] }],
  properties: {},
}];

function createSektor(): Sektor {
  return new Sektor([[{ properties: {} }]], testDefinitions, []);
}

describe("building variants", () => {
  it("keeps the variant index of a created building", () => {
    const sektor = createSektor();

    sektor.createBuilding({ type: "Park", location: { x: 0, y: 0 }, variantIndex: 42 });

    expect(sektor.getState().buildings).toEqual([{ type: "Park", location: { x: 0, y: 0 }, variantIndex: 42 }]);
  });

  it("keeps the variant index of loaded buildings, and leaves it out of buildings loaded without one", () => {
    const sektor = createSektor();

    sektor.loadState({
      buildings: [
        { type: "Park", location: { x: 0, y: 0 }, variantIndex: 7 },
        { type: "Park", location: { x: 1, y: 0 } },
      ],
    });

    expect(sektor.getState().buildings).toEqual([
      { type: "Park", location: { x: 0, y: 0 }, variantIndex: 7 },
      { type: "Park", location: { x: 1, y: 0 } },
    ]);
  });

  it("draws a building as the variant its variant index comes round to among the variants it has", () => {
    const variantNumbers = [0, 1, 2, 3, 4, 100].map(variantIndex => buildingVariantNumber(variantIndex, 3));

    expect(variantNumbers).toEqual([0, 1, 2, 0, 1, 1]);
  });

  it("draws a building without a variant index as its first variant", () => {
    expect(buildingVariantNumber(undefined, 3)).toEqual(0);
  });

  it("draws a building without any variants as its first variant", () => {
    expect(buildingVariantNumber(5, 0)).toEqual(0);
  });

  it("draws variant indexes as whole numbers from 0 to 100", () => {
    const variantIndexes = Array.from({ length: 1000 }, () => randomVariantIndex());

    expect(variantIndexes.every(variantIndex => Number.isInteger(variantIndex) && variantIndex >= 0 && variantIndex <= 100)).toEqual(true);
  });
});
