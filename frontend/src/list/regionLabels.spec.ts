import { describe, it, expect } from "vitest";
import { PlanetRegion } from "./parsePlanet";
import { regionCover, regionLabels } from "./regionLabels";

const land: PlanetRegion = { color: "#00c000", climate: "temperate", biome: "temperate", isLand: true, isForest: false, isDesert: false };

describe("regionLabels", () => {
  it("tells the biome type and what covers the triangle by its biome", () => {
    expect({
      polarLand: regionLabels({ ...land, climate: "polar", biome: "polar" }),
      polarSea: regionLabels({ ...land, climate: "polar", biome: "polar", isLand: false }),
      sea: regionLabels({ ...land, isLand: false }),
      tundra: regionLabels({ ...land, climate: "sub-polar", biome: "polar" }),
      taiga: regionLabels({ ...land, climate: "sub-polar", biome: "polar", isForest: true }),
      subPolarGrassland: regionLabels({ ...land, climate: "sub-polar" }),
      subPolarForest: regionLabels({ ...land, climate: "sub-polar", isForest: true }),
      grassland: regionLabels(land),
      forest: regionLabels({ ...land, isForest: true }),
      temperateDesert: regionLabels({ ...land, isDesert: true }),
      subTropicalGrassland: regionLabels({ ...land, climate: "sub-tropical" }),
      subTropicalSavanna: regionLabels({ ...land, climate: "sub-tropical", biome: "tropical" }),
      subTropicalJungle: regionLabels({ ...land, climate: "sub-tropical", biome: "tropical", isForest: true }),
      subTropicalDesert: regionLabels({ ...land, climate: "sub-tropical", biome: "tropical", isDesert: true }),
      tropicalSavanna: regionLabels({ ...land, climate: "tropical", biome: "tropical" }),
      tropicalJungle: regionLabels({ ...land, climate: "tropical", biome: "tropical", isForest: true }),
      tropicalDesert: regionLabels({ ...land, climate: "tropical", biome: "tropical", isDesert: true }),
      tropicalSea: regionLabels({ ...land, climate: "tropical", biome: "tropical", isLand: false }),
    }).toEqual({
      polarLand: ["❄️ Polar"],
      polarSea: ["❄️ Polar"],
      sea: ["Temperate", "🌊 Sea"],
      tundra: ["Polar", "🌱 Tundra"],
      taiga: ["Polar", "🌲 Taiga"],
      subPolarGrassland: ["Temperate", "🌾 Grassland"],
      subPolarForest: ["Temperate", "🌳 Forest"],
      grassland: ["Temperate", "🌾 Grassland"],
      forest: ["Temperate", "🌳 Forest"],
      temperateDesert: ["Temperate", "🏜 Desert"],
      subTropicalGrassland: ["Temperate", "🌾 Grassland"],
      subTropicalSavanna: ["Tropical", "🌿 Savanna"],
      subTropicalJungle: ["Tropical", "🌴 Jungle"],
      subTropicalDesert: ["Tropical", "🏜 Desert"],
      tropicalSavanna: ["Tropical", "🌿 Savanna"],
      tropicalJungle: ["Tropical", "🌴 Jungle"],
      tropicalDesert: ["Tropical", "🏜 Desert"],
      tropicalSea: ["Tropical", "🌊 Sea"],
    });
  });

  it("tells only what covers the triangle where there is room for one word", () => {
    expect({
      polarLand: regionCover({ ...land, climate: "polar", biome: "polar" }),
      sea: regionCover({ ...land, isLand: false }),
      tundra: regionCover({ ...land, climate: "sub-polar", biome: "polar" }),
      forest: regionCover({ ...land, isForest: true }),
      desert: regionCover({ ...land, isDesert: true }),
      savanna: regionCover({ ...land, climate: "tropical", biome: "tropical" }),
    }).toEqual({
      polarLand: "❄️ Polar",
      sea: "🌊 Sea",
      tundra: "🌱 Tundra",
      forest: "🌳 Forest",
      desert: "🏜 Desert",
      savanna: "🌿 Savanna",
    });
  });
});
