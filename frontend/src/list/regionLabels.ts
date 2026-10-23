import { PlanetRegion } from "./parsePlanet";

const BIOME_LABELS: Record<string, string> = {
  "polar": "Polar",
  "temperate": "Temperate",
  "tropical": "Tropical",
};

const POLAR_CLIMATE_LABEL = "❄️ Polar";

// What a player is told of a triangle: its biome type, then what covers it there, marked by a picture
// of it. The cover goes by the biome: polar land is tundra and taiga, temperate land grassland and
// forest, tropical land savanna and jungle, and any of them may be desert. The polar climate zone is
// only polar.
export function regionLabels(region: PlanetRegion): string[] {
  if (region.climate === "polar") return [POLAR_CLIMATE_LABEL];
  return [BIOME_LABELS[region.biome]!, cover(region)];
}

// What covers a triangle, without its biome type, for where there is room for only one word. The
// polar climate zone has nothing told of its cover, so it is only polar here too.
export function regionCover(region: PlanetRegion): string {
  if (region.climate === "polar") return POLAR_CLIMATE_LABEL;
  return cover(region);
}

function cover(region: PlanetRegion): string {
  if (!region.isLand) return "🌊 Sea";
  if (region.isDesert) return "🏜 Desert";
  if (region.biome === "polar") return region.isForest ? "🌲 Taiga" : "🌱 Tundra";
  if (region.biome === "temperate") return region.isForest ? "🌳 Forest" : "🌾 Grassland";
  return region.isForest ? "🌴 Jungle" : "🌿 Savanna";
}
