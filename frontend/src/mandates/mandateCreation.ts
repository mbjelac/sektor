import { addMandate, getMandates } from "./mandates.api";
import { createMandate, MandateMaterials } from "./createMandate";
import { getNegativeTradableResources, getPositiveTradableResources } from "../resources";
import { globalImportsAndExports } from "../globalImportsAndExports";
import { getSektorList } from "../list/sektorList.api";
import { getSektorSummary } from "../list/sektorSummary";

// So many mandates are made at once while there are none at all, so that there is something to claim
// from the start.
const INITIAL_MANDATE_COUNT = 10;

// Returns whether any mandate was made. Once there are mandates, they are kept as many by a new one
// being made whenever one is claimed, so none are made here again.
export function createInitialMandates(): boolean {
  if (getMandates().length > 0) return false;

  for (let mandateIndex = 0; mandateIndex < INITIAL_MANDATE_COUNT; mandateIndex++) createNewMandate();
  return true;
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
