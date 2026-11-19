import { MandateCriterion } from "./mandates.api";
import { asksForAtLeast, isAboutExports, isAboutResource } from "./criterionType";

// A criterion told in full, as a line of its own: whether it is about exports or imports, at least or
// at most how much, and of which resource, its picture in front of its name. Deforestation is only
// ever asked for at most, and has no resource.
export function criterionDescription(criterion: MandateCriterion, resourceIcon: string | null): string {
  if (!isAboutResource(criterion)) return `Deforestation at most ${criterion.amount}`;
  const resource = resourceIcon ? `${resourceIcon} ${criterion.resourceName}` : criterion.resourceName;
  const direction = isAboutExports(criterion) ? "Export" : "Import";
  const bound = asksForAtLeast(criterion) ? "at least" : "at most";
  return `${direction} ${bound} ${criterion.amount} ${resource}`;
}
