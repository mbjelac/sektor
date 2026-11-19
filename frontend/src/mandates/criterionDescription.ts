import { MandateCriterion } from "./mandates.api";
import { asksForAtLeast, isAboutExports, isAboutResource } from "./criterionType";
import { measureOf } from "./measures";

// A criterion told in full, as a line of its own, in the words before its amount, the amount, and
// the words after it, so that the amount can be set apart from them.
export interface CriterionDescription {
  beforeAmount: string;
  amount: string;
  afterAmount: string;
}

// Whether a criterion is about exports or imports, at least or at most how much, and of which
// resource, its picture in front of its name. A measure, such as deforestation, pollution or
// population, has no resource, and is told by its name alone.
export function criterionDescription(criterion: MandateCriterion, resourceIcon: string | null): CriterionDescription {
  if (!isAboutResource(criterion)) {
    const measure = measureOf(criterion);
    return {
      beforeAmount: `${measure.name} ${measure.asksForAtLeast ? "at least" : "at most"} `,
      amount: `${criterion.amount}`,
      afterAmount: "",
    };
  }
  const resource = resourceIcon ? `${resourceIcon} ${criterion.resourceName}` : criterion.resourceName;
  const direction = isAboutExports(criterion) ? "Export" : "Import";
  const bound = asksForAtLeast(criterion) ? "at least" : "at most";
  return { beforeAmount: `${direction} ${bound} `, amount: `${criterion.amount}`, afterAmount: ` ${resource}` };
}
