import { describe, it, expect } from "vitest";
import { IMPORT_EXPORT_RESOURCE, Sektor } from "./Sektor";
import { TEST_HUB, TEST_HUB_DEFINITION } from "./testImportExportHub";
import { BuildingDefinition } from "./buildings/parseBuildingDefinitions";

const testDefinitions: BuildingDefinition[] = [
  {
    name: "Purifier",
    renderingCode: "box s(1,1,1)",
    buildingFunctions: [{
      inputs: [],
      outputs: [
        { name: "Water", value: 7, affectedByPollution: true },
        { name: "Steam", value: 3 },
      ],
    }],
    properties: {},
  },
];

function purifierPolluted(pollution: number): Sektor {
  const sektor = new Sektor([[{ properties: { pollution } }]], [...testDefinitions, TEST_HUB_DEFINITION], [IMPORT_EXPORT_RESOURCE]);
  sektor.loadState({ buildings: [{ type: "Purifier", location: { x: 0, y: 0 } }, TEST_HUB] });
  return sektor;
}

describe("outputs affected by pollution", () => {
  // 7 * (100 % - 20 %) = 5.6, which rounds to 6.
  it("lose the pollution's percentage of their amount, while other outputs do not", () => {
    const sektor = purifierPolluted(20);

    expect(sektor.getSektorState().exports).toEqual([{ name: "Water", value: 6 }, { name: "Steam", value: 3 }]);
  });

  it("are made in their whole amount on a location which is not polluted", () => {
    const sektor = purifierPolluted(0);

    expect(sektor.getSektorState().exports).toEqual([{ name: "Water", value: 7 }, { name: "Steam", value: 3 }]);
  });

  it("make the building's output decreased by pollution on a polluted location", () => {
    const sektor = purifierPolluted(20);

    expect(sektor.findBuildingsWithOutputDecreasedByPollution()).toEqual([{ x: 0, y: 0 }]);
  });

  it("leave the building's output as it is on a location which is not polluted", () => {
    const sektor = purifierPolluted(0);

    expect(sektor.findBuildingsWithOutputDecreasedByPollution()).toEqual([]);
  });
});
