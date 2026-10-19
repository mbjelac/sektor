import { describe, it, expect } from "vitest";
import { terrainStyleOfRegion } from "./terrainStyle";

describe("terrainStyleOfRegion", () => {
  // Desert has a look of its own whatever its biome, as have the tropics and the polar regions;
  // every other biome, and a sektor lying on no region at all, is drawn the temperate way.
  it("draws desert deserty, the tropics tropical, the polar regions polar and everything else temperate", () => {
    const regions = [
      { biome: "tropical", isDesert: false },
      { biome: "temperate", isDesert: false },
      { biome: "polar", isDesert: false },
      { biome: "tropical", isDesert: true },
      { biome: "temperate", isDesert: true },
      null,
    ];

    expect(regions.map(region => ({ region, terrainStyle: terrainStyleOfRegion(region) }))).toEqual([
      { region: { biome: "tropical", isDesert: false }, terrainStyle: "tropical" },
      { region: { biome: "temperate", isDesert: false }, terrainStyle: "temperate" },
      { region: { biome: "polar", isDesert: false }, terrainStyle: "polar" },
      { region: { biome: "tropical", isDesert: true }, terrainStyle: "desert" },
      { region: { biome: "temperate", isDesert: true }, terrainStyle: "desert" },
      { region: null, terrainStyle: "temperate" },
    ]);
  });
});
