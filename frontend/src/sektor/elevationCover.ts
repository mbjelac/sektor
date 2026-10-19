// How wooded the rock of a sektor is drawn, by the triangle of the planet it lies on. Rock in a
// forest is drawn forested; rock in grassland is drawn as grassland, and so is rock on the sea,
// which has too little land around it to be wooded. A sektor lying nowhere on the planet is drawn
// as grassland too.
export type ElevationCover = "forested" | "grasslands";

export function elevationCoverOfRegion(region: { isLand: boolean; isForest: boolean } | null): ElevationCover {
  return region?.isLand && region.isForest ? "forested" : "grasslands";
}
