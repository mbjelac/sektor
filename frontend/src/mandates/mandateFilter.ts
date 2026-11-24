import { Mandate } from "./mandates.api";
import { completedMandate, PlayerTotals } from "./mandateCompletion";
import { isMinimumCriterion } from "./criterionType";

// The list of mandates shows either those waiting to be claimed or those the player has claimed.
export type MandateFilter = "unclaimed" | "own";

export function filterMandates(mandates: Mandate[], mandateFilter: MandateFilter, playerName: string | null): Mandate[] {
  if (mandateFilter === "unclaimed") return mandates.filter(mandate => mandate.owner === null);
  return mandates.filter(mandate => mandate.owner !== null && mandate.owner === playerName);
}

// A mandate waiting to be claimed which asks for at least so much of something the player's sektors
// already make would be a point for nothing, so the player is not shown it. A mandate which asks only
// for at most so much is shown whether or not they already keep to it.
export function withoutFulfilledMinimumMandates(mandates: Mandate[], playerTotals: PlayerTotals): Mandate[] {
  return mandates.filter(mandate => !isFulfilledMinimumMandate(mandate, playerTotals));
}

function isFulfilledMinimumMandate(mandate: Mandate, playerTotals: PlayerTotals): boolean {
  const minimumCriteria = completedMandate(mandate, playerTotals).criteria.filter(isMinimumCriterion);
  return minimumCriteria.length > 0 && minimumCriteria.every(criterion => criterion.completed);
}
