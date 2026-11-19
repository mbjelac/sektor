import { describe, it, expect, vi } from "vitest";
import { PlanetRegion } from "../list/parsePlanet";
import { TriangleCoordinate } from "../list/planetGrid";

vi.mock("../list/sektorList.api", () => ({ getSektorList: () => [] }));
vi.mock("../list/planet", () => ({ getPlanet: () => { throw new Error("not used"); } }));

const { pickLocationAmong } = await import("./sektorLocation");

const poor: PlanetRegion = { color: "#00c000", climate: "temperate", biome: "temperate", isLand: true, isForest: false, isDesert: false, richOre: null };
const rich: PlanetRegion = { ...poor, richOre: "metals" };

// One ring: two ore-poor areas, then two ore-rich ones.
const regionRings = [[poor, poor, rich, rich]];
const habitable: TriangleCoordinate[] = [0, 1, 2, 3].map(index => ({ ring: 0, index }));

function drawing(...draws: number[]): () => number {
  return () => draws.shift()!;
}

describe("pickLocationAmong", () => {
  it("picks among ore-rich areas one time in four, and among ore-poor ones otherwise", () => {
    expect({
      oreRichFirst: pickLocationAmong(habitable, regionRings, new Set(), drawing(0.1, 0)),
      oreRichLast: pickLocationAmong(habitable, regionRings, new Set(), drawing(0.24, 0.99)),
      orePoorFirst: pickLocationAmong(habitable, regionRings, new Set(), drawing(0.25, 0)),
      orePoorLast: pickLocationAmong(habitable, regionRings, new Set(), drawing(0.9, 0.99)),
    }).toEqual({
      oreRichFirst: { ring: 0, index: 2 },
      oreRichLast: { ring: 0, index: 3 },
      orePoorFirst: { ring: 0, index: 0 },
      orePoorLast: { ring: 0, index: 1 },
    });
  });

  it("leaves out areas of the drawn kind other sektors lie on, until every one of them is taken", () => {
    expect({
      oneTaken: pickLocationAmong(habitable, regionRings, new Set(["0:2"]), drawing(0.1, 0)),
      allTaken: pickLocationAmong(habitable, regionRings, new Set(["0:2", "0:3"]), drawing(0.1, 0.99)),
    }).toEqual({
      oneTaken: { ring: 0, index: 3 },
      allTaken: { ring: 0, index: 3 },
    });
  });
});
