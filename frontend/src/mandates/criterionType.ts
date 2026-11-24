import type { MandateCriterion, ResourceCriterion } from "./mandates.api";

// A criterion is about a resource, or else about how much the player's sektors are deforested or
// polluted, how many people they house, or how much Hapiness they make.
export function isAboutResource(criterion: MandateCriterion): criterion is ResourceCriterion {
  return ["minimumExport", "maximumExport", "minimumImport", "maximumImport"].includes(criterion.type);
}

// Every criterion about a resource is about either exports or imports, and asks for either at least
// or at most an amount of them.
export function isAboutExports(criterion: ResourceCriterion): boolean {
  return criterion.type === "minimumExport" || criterion.type === "maximumExport";
}

export function asksForAtLeast(criterion: ResourceCriterion): boolean {
  return criterion.type === "minimumExport" || criterion.type === "minimumImport";
}

// A minimum criterion asks for at least so much of something: a resource exported or imported, people
// housed, or Hapiness made.
export function isMinimumCriterion(criterion: MandateCriterion): boolean {
  return ["minimumExport", "minimumImport", "minimumPopulation", "minimumHapiness"].includes(criterion.type);
}

// Two criteria are the same criterion when they are of the same type and, where they are about a
// resource, about the same resource, whatever amounts they ask for.
export function isSameCriterion(criterion: MandateCriterion, otherCriterion: MandateCriterion): boolean {
  if (criterion.type !== otherCriterion.type) return false;
  if (!isAboutResource(criterion) || !isAboutResource(otherCriterion)) return true;
  return criterion.resourceName === otherCriterion.resourceName;
}
