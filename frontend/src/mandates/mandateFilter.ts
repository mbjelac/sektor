import { Mandate } from "./mandates.api";
import { completedMandate, PlayerTotals } from "./mandateCompletion";
import { isMinimumCriterion, isSameCriterion } from "./criterionType";

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

// Of mandates waiting to be claimed which ask for the same, differing only in amounts, the player is
// shown only one, so that the list is not filled with the same thing over again: the oldest, the one
// of the lowest number, which stays the one shown however the player builds.
export function onePerCriterion(mandates: Mandate[]): Mandate[] {
  return mandates.filter(mandate => !mandates.some(otherMandate =>
    otherMandate.number < mandate.number && haveSameCriteria(otherMandate, mandate)));
}

// Two mandates ask for the same when every criterion of each is the same criterion as one of the other.
function haveSameCriteria(mandate: Mandate, otherMandate: Mandate): boolean {
  return mandate.criteria.length === otherMandate.criteria.length
    && mandate.criteria.every(criterion => otherMandate.criteria.some(otherCriterion => isSameCriterion(criterion, otherCriterion)));
}
