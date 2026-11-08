import { MandateCriterion } from "./mandates.api";
import { asksForAtLeast, isAboutExports } from "./criterionType";

// A criterion told in full, as a line of its own: whether it is about exports or imports, at least or
// at most how much, and of which resource, its picture in front of its name.
export function criterionDescription(criterion: MandateCriterion, resourceIcon: string | null): string {
  const resource = resourceIcon ? `${resourceIcon} ${criterion.resourceName}` : criterion.resourceName;
  const direction = isAboutExports(criterion) ? "Export" : "Import";
  const bound = asksForAtLeast(criterion) ? "at least" : "at most";
  return `${direction} ${bound} ${criterion.amount} ${resource}`;
}
