// Which look a sektor's ground, rock and forests are drawn in, by the biome of the triangle of the
// planet it lies on. Only the tropics have a look of their own so far: every other biome is drawn
// the temperate way, as is a sektor lying nowhere on the planet.
export type TerrainStyle = "temperate" | "tropical";

export function terrainStyleOfBiome(biome: string | null): TerrainStyle {
  return biome === "tropical" ? "tropical" : "temperate";
}
