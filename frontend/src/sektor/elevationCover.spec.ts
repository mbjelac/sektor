import { describe, it, expect } from "vitest";
import { elevationCoverOfRegion } from "./elevationCover";

describe("elevationCoverOfRegion", () => {
  // Only forested land is drawn with forested rock: grassland, the sea and a sektor lying on no
  // region at all are drawn with grassland rock.
  it("draws forest rock forested and every other rock as grassland", () => {
    const regions = [
      { isLand: true, isForest: true },
      { isLand: true, isForest: false },
      { isLand: false, isForest: false },
      { isLand: false, isForest: true },
      null,
    ];

    expect(regions.map(region => ({ region, elevationCover: elevationCoverOfRegion(region) }))).toEqual([
      { region: { isLand: true, isForest: true }, elevationCover: "forested" },
      { region: { isLand: true, isForest: false }, elevationCover: "grasslands" },
      { region: { isLand: false, isForest: false }, elevationCover: "grasslands" },
      { region: { isLand: false, isForest: true }, elevationCover: "grasslands" },
      { region: null, elevationCover: "grasslands" },
    ]);
  });
});
