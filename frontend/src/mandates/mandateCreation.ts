import { addMandate, getMandates } from "./mandates.api";
import { createMandate, MandateMaterials } from "./createMandate";
import { getNegativeTradableResources, getPositiveTradableResources } from "../resources";
import { globalImportsAndExports } from "../globalImportsAndExports";
import { getSektorList } from "../list/sektorList.api";
import { getSektorSummary } from "../list/sektorSummary";

// So many mandates are kept waiting to be claimed, so that there is always something to claim.
const MANDATE_POOL_SIZE = 50;

// When the game loads, mandates are made until as many are waiting to be claimed as the pool holds.
// Between loads, the pool is kept full by a new mandate being made whenever one is claimed. Returns
// whether any mandate was made.
export function fillMandatePool(): boolean {
  const missingMandateCount = MANDATE_POOL_SIZE - countUnclaimedMandates();
  for (let mandateIndex = 0; mandateIndex < missingMandateCount; mandateIndex++) createNewMandate();
  return missingMandateCount > 0;
}

function countUnclaimedMandates(): number {
  return getMandates().filter(mandate => mandate.owner === null).length;
}

// A mandate is made only when one is asked for, never in the background.
export function createNewMandate(): void {
  addMandate(createMandate(nextMandateNumber(), mandateMaterials()));
}

// Mandates are numbered from 1, and the number carries on above the highest one already made so that
// a reload never hands out a number twice.
function nextMandateNumber(): number {
  const mandateNumbers = getMandates().map(mandate => mandate.number);
  return mandateNumbers.length === 0 ? 1 : Math.max(...mandateNumbers) + 1;
}

// What the planet brings in and sends out changes as sektors are built on, and so do its polluting
// buildings and its habitats, and the Hapiness those could make, so they are gathered anew whenever a
// mandate is to be made. A mandate is made for no player in particular, so every sektor of the planet
// counts, whoever owns it.
function mandateMaterials(): MandateMaterials {
  const planetSektorSummaries = getSektorList().map(sektorListItem => getSektorSummary(sektorListItem.id));
  return {
    positiveResourceNames: getPositiveTradableResources(),
    negativeResourceNames: getNegativeTradableResources(),
    planetImportsAndExports: globalImportsAndExports(planetSektorSummaries),
    planetPollutionFootprint: planetSektorSummaries
      .reduce((total, sektorSummary) => total + sektorSummary.pollutionFootprint, 0),
    planetHabitatCount: planetSektorSummaries
      .reduce((total, sektorSummary) => total + sektorSummary.habitatCount, 0),
    planetPossibleHapiness: planetSektorSummaries
      .reduce((total, sektorSummary) => total + sektorSummary.possibleHapiness, 0),
  };
}
