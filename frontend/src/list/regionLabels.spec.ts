import { describe, it, expect } from "vitest";
import { PlanetRegion } from "./parsePlanet";
import { regionLabels } from "./regionLabels";

const land: PlanetRegion = { color: "#00c000", climate: "temperate", biome: "temperate", isLand: true, isForest: false, isDesert: false };

describe("regionLabels", () => {
  it("tells the climate zone of land and what covers it", () => {
    expect({
      sea: regionLabels({ ...land, isLand: false }),
      polar: regionLabels({ ...land, climate: "polar", biome: "polar" }),
      tundra: regionLabels({ ...land, climate: "sub-polar" }),
      taiga: regionLabels({ ...land, climate: "sub-polar", isForest: true }),
      grassland: regionLabels(land),
      forest: regionLabels({ ...land, isForest: true }),
      temperateDesert: regionLabels({ ...land, isDesert: true }),
      subTropicalSavanna: regionLabels({ ...land, climate: "sub-tropical" }),
      subTropicalJungle: regionLabels({ ...land, climate: "sub-tropical", isForest: true }),
      subTropicalDesert: regionLabels({ ...land, climate: "sub-tropical", isDesert: true }),
      tropicalSavanna: regionLabels({ ...land, climate: "tropical", biome: "tropical" }),
      tropicalJungle: regionLabels({ ...land, climate: "tropical", biome: "tropical", isForest: true }),
      tropicalDesert: regionLabels({ ...land, climate: "tropical", biome: "tropical", isDesert: true }),
    }).toEqual({
      sea: ["Sea"],
      polar: ["Polar"],
      tundra: ["Sub-polar", "Tundra"],
      taiga: ["Sub-polar", "Taiga"],
      grassland: ["Temperate", "Grassland"],
      forest: ["Temperate", "Forest"],
      temperateDesert: ["Temperate", "Desert"],
      subTropicalSavanna: ["Sub-tropical", "Savanna"],
      subTropicalJungle: ["Sub-tropical", "Jungle"],
      subTropicalDesert: ["Sub-tropical", "Desert"],
      tropicalSavanna: ["Tropical", "Savanna"],
      tropicalJungle: ["Tropical", "Jungle"],
      tropicalDesert: ["Tropical", "Desert"],
    });
  });

  it("goes by the climate zone, not the biome", () => {
    expect(regionLabels({ ...land, climate: "sub-polar", biome: "polar", isForest: true })).toEqual(["Sub-polar", "Taiga"]);
  });
});
