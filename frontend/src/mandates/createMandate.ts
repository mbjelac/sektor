import { RandomNumber } from "../creation/randomNumber";
import { Mandate, MandateCriterion } from "./mandates.api";
import { ImportsAndExports, findThroughputValue } from "../globalImportsAndExports";
import { ResourceThroughput } from "../../../shared/sektorData";
import { forestEcosystemSupport } from "../sektor/forest";
import { POLLUTION_STEP, pollutionFootprint } from "../sektor/pollution";

const LOWEST_AMOUNT = 5;
const HIGHEST_AMOUNT = 50;
// Most mandates ask for a positive resource sent out; the rest ask for a negative one taken in.
const NEGATIVE_IMPORT_CHANCE = 1 / 3;
// Some mandates ask instead for the player's sektors to be deforested by no more than so much, drawn
// as so many forests' worth of support. None at all is a harsh thing to ask, letting no sektor of the
// player's lose a single forest, so it is only one of the many amounts drawn.
const DEFORESTATION_CHANCE = 1 / 6;
const MOST_FELLED_FORESTS = 20;
// Some ask for the player's sektors to be polluted no more than so much, drawn in steps of pollution
// up to the most their polluting buildings can foul. A player with no polluting building yet is asked
// for no more than the least polluting building can foul.
const POLLUTION_CHANCE = 1 / 6;
const LEAST_POLLUTION_AREA = 1;

// What a mandate can be made of: the resources a sektor can import and export, those doing good and
// those doing harm, what the whole planet brings in and sends out of them, and the most the player's
// polluting buildings can foul.
export interface MandateMaterials {
  positiveResourceNames: string[];
  negativeResourceNames: string[];
  planetImportsAndExports: ImportsAndExports;
  playerPollutionFootprint: number;
}

// A mandate asks for one of four things: to send out a positive resource, to take in a negative
// one, or to deforest or to pollute no more than so much. Nobody owns it when it is made, so nobody has completed it either.
export function createMandate(
  mandateNumber: number,
  mandateMaterials: MandateMaterials,
  randomNumber: RandomNumber = Math.random,
): Mandate {
  return {
    number: mandateNumber,
    owner: null,
    criteria: createCriteria(mandateMaterials, randomNumber),
    completed: false,
  };
}

// A positive resource the planet brings in much of is one it needs sent out, and a negative resource
// it sends out much of is one it needs taken in, so the more the planet moves of a resource the more
// likely a mandate asks for it.
function createCriteria(mandateMaterials: MandateMaterials, randomNumber: RandomNumber): MandateCriterion[] {
  const strategyDraw = randomNumber();
  if (mandateMaterials.negativeResourceNames.length > 0 && strategyDraw < NEGATIVE_IMPORT_CHANCE) {
    return [criterion(
      "minimumImport",
      mandateMaterials.negativeResourceNames,
      mandateMaterials.planetImportsAndExports.exports,
      randomNumber,
    )];
  }
  if (strategyDraw >= NEGATIVE_IMPORT_CHANCE && strategyDraw < NEGATIVE_IMPORT_CHANCE + DEFORESTATION_CHANCE) {
    return [deforestationCriterion(randomNumber)];
  }
  if (strategyDraw >= 1 - POLLUTION_CHANCE) {
    return [pollutionCriterion(mandateMaterials.playerPollutionFootprint, randomNumber)];
  }
  if (mandateMaterials.positiveResourceNames.length === 0) return [];
  return [criterion(
    "minimumExport",
    mandateMaterials.positiveResourceNames,
    mandateMaterials.planetImportsAndExports.imports,
    randomNumber,
  )];
}

function criterion(
  type: "minimumImport" | "minimumExport",
  resourceNames: string[],
  planetThroughputs: ResourceThroughput[],
  randomNumber: RandomNumber,
): MandateCriterion {
  return {
    type,
    resourceName: drawnByPlanetThroughput(resourceNames, planetThroughputs, randomNumber),
    amount: drawnAmount(randomNumber),
    completed: false,
  };
}

function deforestationCriterion(randomNumber: RandomNumber): MandateCriterion {
  const felledForests = Math.floor(randomNumber() * (MOST_FELLED_FORESTS + 1));
  return {
    type: "maximumDeforestation",
    amount: felledForests * forestEcosystemSupport(),
    completed: false,
  };
}

function pollutionCriterion(playerPollutionFootprint: number, randomNumber: RandomNumber): MandateCriterion {
  const mostPollution = playerPollutionFootprint > 0 ? playerPollutionFootprint : pollutionFootprint(LEAST_POLLUTION_AREA);
  const pollutionSteps = Math.floor(randomNumber() * (Math.floor(mostPollution / POLLUTION_STEP) + 1));
  return {
    type: "maximumPollution",
    amount: pollutionSteps * POLLUTION_STEP,
    completed: false,
  };
}

// A resource is drawn as likely as the planet moves it, and one it does not move at all is never
// drawn, unless the planet moves none of them, when each is as likely as any other.
function drawnByPlanetThroughput(
  resourceNames: string[],
  planetThroughputs: ResourceThroughput[],
  randomNumber: RandomNumber,
): string {
  const movedResourceNames = resourceNames.filter(resourceName => findThroughputValue(planetThroughputs, resourceName) > 0);
  if (movedResourceNames.length === 0) return resourceNames[Math.floor(randomNumber() * resourceNames.length)];

  const totalMoved = movedResourceNames
    .reduce((total, resourceName) => total + findThroughputValue(planetThroughputs, resourceName), 0);
  let remainingDraw = randomNumber() * totalMoved;
  for (const resourceName of movedResourceNames) {
    remainingDraw -= findThroughputValue(planetThroughputs, resourceName);
    if (remainingDraw < 0) return resourceName;
  }
  return movedResourceNames[movedResourceNames.length - 1];
}

function drawnAmount(randomNumber: RandomNumber): number {
  return LOWEST_AMOUNT + Math.floor(randomNumber() * (HIGHEST_AMOUNT - LOWEST_AMOUNT + 1));
}
