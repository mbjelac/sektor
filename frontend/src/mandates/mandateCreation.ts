import { addMandate, getMandates } from "./mandates.api";
import { createMandate, MandateMaterials } from "./createMandate";
import { getNegativeTradableResources, getPositiveTradableResources } from "../resources";
import { globalImportsAndExports } from "../globalImportsAndExports";
import { getSektorList } from "../list/sektorList.api";
import { getSektorSummary } from "../list/sektorSummary";
import { getUsername } from "../login/login.api";

const CREATION_INTERVAL_MILLISECONDS = 1000;
// Mandates nobody has taken up pile up if they are made faster than they are claimed, so no more are
// made once there are this many waiting.
const MAXIMUM_UNCLAIMED_MANDATES = 10;

let creationTimer: ReturnType<typeof setInterval> | null = null;

// Mandates are made in the background, as sektors are, so that there is always something to claim.
export function startCreatingMandates(onMandateCreated: () => void) {
  creationTimer = setInterval(() => {
    if (createMandateIfNeeded()) onMandateCreated();
  }, CREATION_INTERVAL_MILLISECONDS);
}

// Stopping is harmless when nothing was ever started, which is the case on a page opened by a test.
export function stopCreatingMandates() {
  if (creationTimer === null) return;
  clearInterval(creationTimer);
  creationTimer = null;
}

// Returns whether a mandate was made.
export function createMandateIfNeeded(): boolean {
  if (countUnclaimedMandates() >= MAXIMUM_UNCLAIMED_MANDATES) return false;

  addMandate(createMandate(nextMandateNumber(), mandateMaterials()));
  return true;
}

function countUnclaimedMandates(): number {
  return getMandates().filter(mandate => mandate.owner === null).length;
}

// Mandates are numbered from 1, and the number carries on above the highest one already made so that
// a reload never hands out a number twice.
function nextMandateNumber(): number {
  const mandateNumbers = getMandates().map(mandate => mandate.number);
  return mandateNumbers.length === 0 ? 1 : Math.max(...mandateNumbers) + 1;
}

// What the planet brings in and sends out changes as sektors are built on, and so do the polluting
// buildings and the habitats of the player's sektors, so they are gathered anew whenever a mandate is
// to be made.
function mandateMaterials(): MandateMaterials {
  const playerName = getUsername();
  const sektorListItems = getSektorList();
  const playerSektorSummaries = sektorListItems
    .filter(sektorListItem => playerName !== null && sektorListItem.owner === playerName)
    .map(sektorListItem => getSektorSummary(sektorListItem.id));
  return {
    positiveResourceNames: getPositiveTradableResources(),
    negativeResourceNames: getNegativeTradableResources(),
    planetImportsAndExports: globalImportsAndExports(
      sektorListItems.map(sektorListItem => getSektorSummary(sektorListItem.id)),
    ),
    playerPollutionFootprint: playerSektorSummaries
      .reduce((total, sektorSummary) => total + sektorSummary.pollutionFootprint, 0),
    playerHabitatCount: playerSektorSummaries
      .reduce((total, sektorSummary) => total + sektorSummary.habitatCount, 0),
  };
}
