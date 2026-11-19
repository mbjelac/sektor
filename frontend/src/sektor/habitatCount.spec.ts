import { describe, it, expect } from "vitest";
import { Sektor, Location } from "./Sektor";
import { BuildingDefinition } from "./buildings/parseBuildingDefinitions";

const testDefinitions: BuildingDefinition[] = [
  {
    name: "Hut",
    renderingCodes: ["box s(1,1,1)"],
    buildingFunctions: [{ inputs: [{ name: "Food", value: 1 }], outputs: [{ name: "Hapiness", value: 1 }] }],
    properties: {},
  },
  {
    name: "Bakery",
    renderingCodes: ["box s(1,1,1)"],
    buildingFunctions: [{ inputs: [], outputs: [{ name: "Bread", value: 2 }] }],
    properties: {},
  },
];

function emptyLocations(count: number): Location[][] {
  return Array.from({ length: count }, () => [{ properties: {} }]);
}

describe("habitat count", () => {
  // The huts are short of the Food they ask for, and are habitats all the same.
  it("counts every building made to give off Hapiness, whether it does or not", () => {
    const sektor = new Sektor(emptyLocations(3), testDefinitions, []);
    sektor.loadState({
      buildings: [
        { type: "Hut", location: { x: 0, y: 0 } },
        { type: "Bakery", location: { x: 1, y: 0 } },
        { type: "Hut", location: { x: 2, y: 0 } },
      ],
    });

    expect(sektor.findHabitatCount()).toEqual(2);
  });
});
