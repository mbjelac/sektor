import { Mandate, MandateCriterion } from "./mandates.api";
import { isSameCriterion } from "./criterionType";

// The criteria of the player's own mandates which a mandate shares, as the player has them. A player
// holds at most one mandate per criterion, so a mandate sharing any of them cannot be claimed by them
// until they give up the one they hold. Somebody not logged in holds none.
export function heldCriteria(mandate: Mandate, mandates: Mandate[], playerName: string | null): MandateCriterion[] {
  return mandates
    .filter(heldMandate => playerName !== null && heldMandate.owner === playerName && heldMandate.number !== mandate.number)
    .flatMap(heldMandate => heldMandate.criteria)
    .filter(heldCriterion => mandate.criteria.some(criterion => isSameCriterion(criterion, heldCriterion)));
}
