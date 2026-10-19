import { PlanetRegion } from "./parsePlanet";

const CLIMATE_LABELS: Record<string, string> = {
  "polar": "Polar",
  "sub-polar": "Sub-polar",
  "temperate": "Temperate",
  "sub-tropical": "Sub-tropical",
  "tropical": "Tropical",
};

// What a player is told of a triangle: its climate zone, then what covers it there. The cover goes
// by the biome: polar land is tundra and taiga, temperate land grassland and forest, tropical land
// savanna and jungle, and any of them may be desert. The polar zone is only polar.
export function regionLabels(region: PlanetRegion): string[] {
  if (region.climate === "polar") return ["Polar"];
  return [CLIMATE_LABELS[region.climate]!, cover(region)];
}

function cover(region: PlanetRegion): string {
  if (!region.isLand) return "Sea";
  if (region.isDesert) return "Desert";
  if (region.biome === "polar") return region.isForest ? "Taiga" : "Tundra";
  if (region.biome === "temperate") return region.isForest ? "Forest" : "Grassland";
  return region.isForest ? "Jungle" : "Savanna";
}
