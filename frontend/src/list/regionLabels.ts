import { PlanetRegion } from "./parsePlanet";

const CLIMATE_LABELS: Record<string, string> = {
  "polar": "Polar",
  "sub-polar": "Sub-polar",
  "temperate": "Temperate",
  "sub-tropical": "Sub-tropical",
  "tropical": "Tropical",
};

// What a player is told of the land at a triangle: its climate zone, then what covers it there. The
// cold zones have tundra and taiga, the temperate zone grassland and forest, the warm zones savanna
// and jungle, and every zone but the cold ones its deserts. Polar land is only polar, and the sea is
// only the sea.
export function regionLabels(region: PlanetRegion): string[] {
  if (!region.isLand) return ["Sea"];
  if (region.climate === "polar") return ["Polar"];
  return [CLIMATE_LABELS[region.climate]!, landCover(region)];
}

function landCover(region: PlanetRegion): string {
  if (region.isDesert) return "Desert";
  if (region.climate === "sub-polar") return region.isForest ? "Taiga" : "Tundra";
  if (region.climate === "temperate") return region.isForest ? "Forest" : "Grassland";
  return region.isForest ? "Jungle" : "Savanna";
}
