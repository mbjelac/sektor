import { MandateCriterion } from "./mandates.api";
import { isAboutExports, isAboutResource } from "./criterionType";
import { measureOf } from "./measures";
import { PlayerSektor, sektorsMovingResource } from "./sektorsMovingResource";

// A sektor of the player's which counts towards a criterion, and by how much.
export interface CriterionSektor {
  sektorId: string;
  sektorName: string;
  amount: number;
}

// The sektors of the player's which make up what they come to of a criterion, in the order they were
// given. A sektor moving the criterion's resource counts towards it by what it moves the asked way,
// and against it, below nothing, by what it moves the other way. A sektor counts towards a measure by
// as much of it as it comes to, and one coming to none of it has nothing to do with it and is left out.
export function criterionSektors(criterion: MandateCriterion, playerSektors: PlayerSektor[]): CriterionSektor[] {
  if (isAboutResource(criterion)) {
    return sektorsMovingResource(playerSektors, criterion.resourceName).map(resourceMovingSektor => ({
      sektorId: resourceMovingSektor.sektorId,
      sektorName: resourceMovingSektor.sektorName,
      amount: isAboutExports(criterion)
        ? resourceMovingSektor.exported - resourceMovingSektor.imported
        : resourceMovingSektor.imported - resourceMovingSektor.exported,
    }));
  }

  const measure = measureOf(criterion);
  return playerSektors
    .map(playerSektor => ({
      sektorId: playerSektor.sektorId,
      sektorName: playerSektor.sektorName,
      amount: measure.sektorAmount(playerSektor),
    }))
    .filter(criterionSektor => criterionSektor.amount > 0);
}
