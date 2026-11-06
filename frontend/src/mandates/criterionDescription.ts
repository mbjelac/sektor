import { MandateCriterion } from "./mandates.api";

// A criterion told in full, as a line of its own: what is to be done, how much of it, and of which
// resource, its picture in front of its name.
export function criterionDescription(criterion: MandateCriterion, resourceIcon: string | null): string {
  const resource = resourceIcon ? `${resourceIcon} ${criterion.resourceName}` : criterion.resourceName;
  if (criterion.type === "minimumExport") return `Export at least ${criterion.amount} ${resource}`;
  return `Import at most ${criterion.amount} ${resource}`;
}
