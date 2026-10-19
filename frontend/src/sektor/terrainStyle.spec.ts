import { describe, it, expect } from "vitest";
import { terrainStyleOfBiome } from "./terrainStyle";

describe("terrainStyleOfBiome", () => {
  // Only the tropics have a look of their own so far; every other biome, and a sektor lying on no
  // biome at all, is drawn the temperate way.
  it("draws the tropics tropical and everything else temperate", () => {
    const biomes = ["tropical", "temperate", "polar", null];

    expect(biomes.map(biome => ({ biome, terrainStyle: terrainStyleOfBiome(biome) }))).toEqual([
      { biome: "tropical", terrainStyle: "tropical" },
      { biome: "temperate", terrainStyle: "temperate" },
      { biome: "polar", terrainStyle: "temperate" },
      { biome: null, terrainStyle: "temperate" },
    ]);
  });
});
