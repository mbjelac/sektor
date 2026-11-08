import type { MandateCriterion } from "./mandates.api";

// Every criterion is about either exports or imports, and asks for either at least or at most an
// amount of them.
export function isAboutExports(criterion: MandateCriterion): boolean {
  return criterion.type === "minimumExport" || criterion.type === "maximumExport";
}

export function asksForAtLeast(criterion: MandateCriterion): boolean {
  return criterion.type === "minimumExport" || criterion.type === "minimumImport";
}
