import { Mandate } from "./mandates.api";

// What a mandate is about: trade, the planet's ecology, or the sektors' people.
export type MandateCategory = "economic" | "ecologic" | "social";

// What every category is called where a mandate is told in full.
export const MANDATE_CATEGORY_NAMES: Record<MandateCategory, string> = {
  economic: "Economy",
  ecologic: "Ecology",
  social: "Society",
};

// A mandate is of the category its first criterion is about, and a mandate asking for nothing counts
// as economic, as every mandate did before there were any other.
export function mandateCategory(mandate: Mandate): MandateCategory {
  const firstCriterion = mandate.criteria[0];
  if (!firstCriterion) return "economic";
  switch (firstCriterion.type) {
    case "maximumDeforestation":
    case "maximumPollution":
      return "ecologic";
    case "minimumPopulation":
    case "maximumPopulation":
    case "minimumHapiness":
      return "social";
    default:
      return "economic";
  }
}
