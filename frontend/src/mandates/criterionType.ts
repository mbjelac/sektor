import type { MandateCriterion, ResourceCriterion } from "./mandates.api";

// A criterion is about a resource, or else about how much the player's sektors are deforested or
// polluted.
export function isAboutResource(criterion: MandateCriterion): criterion is ResourceCriterion {
  return criterion.type !== "maximumDeforestation" && criterion.type !== "maximumPollution";
}

// Every criterion about a resource is about either exports or imports, and asks for either at least
// or at most an amount of them.
export function isAboutExports(criterion: ResourceCriterion): boolean {
  return criterion.type === "minimumExport" || criterion.type === "maximumExport";
}

export function asksForAtLeast(criterion: ResourceCriterion): boolean {
  return criterion.type === "minimumExport" || criterion.type === "minimumImport";
}
