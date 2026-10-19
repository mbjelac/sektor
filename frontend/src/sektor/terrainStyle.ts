// Which look a sektor's ground, rock and forests are drawn in, by the triangle of the planet it lies
// on. Desert has a look of its own whatever its biome, and so have the tropics and the polar
// regions: every other biome is drawn the temperate way, as is a sektor lying nowhere on the planet.
export type TerrainStyle = "temperate" | "tropical" | "polar" | "desert";

export function terrainStyleOfRegion(region: { biome: string; isDesert: boolean } | null): TerrainStyle {
  if (region?.isDesert) return "desert";
  if (region?.biome === "tropical") return "tropical";
  if (region?.biome === "polar") return "polar";
  return "temperate";
}
