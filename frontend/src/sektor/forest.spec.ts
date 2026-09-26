import { describe, it, expect } from "vitest";
import { FOREST_DEFINITION, forestRenderingCode } from "./forest";
import { Sektor } from "./Sektor";

// How many shapes a forest stands in: one file for each of them.
const FOREST_VARIATION_COUNT = 10;

describe("forestRenderingCode", () => {
  // Every shape a square can be counted down to has bodies to draw it with, so no forest comes out
  // empty.
  it("has bodies to draw every shape of a forest", () => {
    const shapesWithoutBodies = Array.from({ length: FOREST_VARIATION_COUNT }, (_unused, variation) => variation)
      .filter(variation => forestRenderingCode(variation) === "");

    expect(shapesWithoutBodies).toEqual([]);
  });
});

describe("FOREST_DEFINITION", () => {
  // Health stays in the sektor it is made in, while the support a forest gives the ecosystem is
  // sent out like any other resource made in more than the sektor uses.
  it("gives the sektor health and exports its ecosystem support, taking nothing in", () => {
    const sektor = new Sektor([], [FOREST_DEFINITION], ["HealthPhysical", "HealthSocial", "HealthMental"]);
    sektor.loadState({ buildings: [{ type: "Forest", location: { x: 0, y: 0 } }] });
    const sektorState = sektor.getSektorState();

    expect({ imports: sektorState.imports, exports: sektorState.exports }).toEqual({
      imports: [],
      exports: [{ name: "EcosystemSupport", value: 14 }],
    });
  });
});
