// Which look a sektor's ground, rock and forests are drawn in, by the biome of the triangle of the
// planet it lies on. The tropics and the polar regions have a look of their own: every other biome
// is drawn the temperate way, as is a sektor lying nowhere on the planet.
export type TerrainStyle = "temperate" | "tropical" | "polar";

export function terrainStyleOfBiome(biome: string | null): TerrainStyle {
  if (biome === "tropical") return "tropical";
  if (biome === "polar") return "polar";
  return "temperate";
}
