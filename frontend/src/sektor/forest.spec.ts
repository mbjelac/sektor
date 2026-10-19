import { describe, it, expect } from "vitest";
import { ECOSYSTEM_SUPPORT_RESOURCE, FOREST_DEFINITION, forestRenderingCode } from "./forest";
import { IMPORT_EXPORT_RESOURCE, Sektor } from "./Sektor";
import { TEST_HUB, TEST_HUB_DEFINITION } from "./testImportExportHub";
import { TerrainStyle } from "./terrainStyle";

// How many shapes a forest stands in: one file for each of them.
const FOREST_VARIATION_COUNT = 10;

const TERRAIN_STYLES: TerrainStyle[] = ["temperate", "tropical", "polar"];

describe("forestRenderingCode", () => {
  // Every shape a square can be counted down to has bodies to draw it with, in every look of the
  // terrain, so no forest comes out empty.
  it("has bodies to draw every shape of a forest in every look", () => {
    const shapesWithoutBodies = TERRAIN_STYLES
      .flatMap(terrainStyle => Array.from({ length: FOREST_VARIATION_COUNT }, (_unused, variation) => ({ terrainStyle, variation })))
      .filter(({ terrainStyle, variation }) => forestRenderingCode(variation, terrainStyle) === "");

    expect(shapesWithoutBodies).toEqual([]);
  });

  // A tropical or polar forest is drawn from its own folder, not the temperate one.
  it("draws tropical and polar forests unlike temperate ones", () => {
    const shapesDrawnAlike = (["tropical", "polar"] as const)
      .flatMap(terrainStyle => Array.from({ length: FOREST_VARIATION_COUNT }, (_unused, variation) => ({ terrainStyle, variation })))
      .filter(({ terrainStyle, variation }) => forestRenderingCode(variation, terrainStyle) === forestRenderingCode(variation, "temperate"));

    expect(shapesDrawnAlike).toEqual([]);
  });
});

describe("FOREST_DEFINITION", () => {
  // Health stays in the sektor it is made in, while the support a forest gives the ecosystem is
  // sent out like any other resource made in more than the sektor uses.
  it("gives the sektor health and exports its ecosystem support, taking nothing in", () => {
    const sektor = new Sektor([], [FOREST_DEFINITION, TEST_HUB_DEFINITION], ["HealthPhysical", "HealthSocial", "HealthMental", IMPORT_EXPORT_RESOURCE]);
    sektor.loadState({ buildings: [{ type: "Forest", location: { x: 0, y: 0 } }, TEST_HUB] });
    const sektorState = sektor.getSektorState();

    expect({ imports: sektorState.imports, exports: sektorState.exports }).toEqual({
      imports: [],
      exports: [{ name: "EcosystemSupport", value: 5 }],
    });
  });

  // 5 * (100 % - 40 %) = 3.
  it("gives less ecosystem support on polluted ground", () => {
    const sektor = new Sektor([[{ properties: { pollution: 40 } }]], [FOREST_DEFINITION, TEST_HUB_DEFINITION], ["HealthPhysical", "HealthSocial", "HealthMental", IMPORT_EXPORT_RESOURCE]);
    sektor.loadState({ buildings: [{ type: "Forest", location: { x: 0, y: 0 } }, TEST_HUB] });

    expect(sektor.getSektorState().exports).toEqual([{ name: "EcosystemSupport", value: 3 }]);
  });

  it("supports the ecosystem even where its support cannot leave the sektor", () => {
    const sektor = new Sektor([], [FOREST_DEFINITION, TEST_HUB_DEFINITION], [ECOSYSTEM_SUPPORT_RESOURCE, IMPORT_EXPORT_RESOURCE]);
    sektor.loadState({ buildings: [{ type: "Forest", location: { x: 0, y: 0 } }, TEST_HUB] });

    expect(sektor.getSektorState().ecosystemSupport).toEqual(5);
  });

  it("is a building whose output pollution has decreased on polluted ground", () => {
    const sektor = new Sektor([[{ properties: { pollution: 40 } }]], [FOREST_DEFINITION], []);
    sektor.loadState({ buildings: [{ type: "Forest", location: { x: 0, y: 0 } }] });

    expect(sektor.findBuildingsWithOutputDecreasedByPollution()).toEqual([{ x: 0, y: 0 }]);
  });
});
