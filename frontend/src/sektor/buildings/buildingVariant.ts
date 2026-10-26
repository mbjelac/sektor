// The variant index of a building is drawn from 0 to this, whatever number of variants the building
// has, so that a building given more variants later spreads its existing buildings over them too.
const HIGHEST_VARIANT_INDEX = 100;

export function randomVariantIndex(): number {
  return Math.floor(Math.random() * (HIGHEST_VARIANT_INDEX + 1));
}

// A building is drawn as the variant its variant index comes round to among the variants it has,
// so that the variant drawn always exists. A building without a variant index is drawn as its first.
export function buildingVariantNumber(variantIndex: number | undefined, numberOfBuildingVariants: number): number {
  if (variantIndex === undefined || numberOfBuildingVariants === 0) return 0;
  return variantIndex % numberOfBuildingVariants;
}
