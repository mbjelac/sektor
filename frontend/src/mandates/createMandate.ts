import { RandomNumber } from "../creation/randomNumber";
import { Mandate, MandateCriterion } from "./mandates.api";
import { ImportsAndExports, findThroughputValue } from "../globalImportsAndExports";
import { ResourceThroughput } from "../../../shared/sektorData";

const LOWEST_AMOUNT = 5;
const HIGHEST_AMOUNT = 50;
// Most mandates ask for a positive resource sent out; the rest ask for a negative one taken in.
const NEGATIVE_IMPORT_CHANCE = 1 / 3;

// What a mandate can be made of: the resources a sektor can import and export, those doing good and
// those doing harm, and what the whole planet brings in and sends out of them.
export interface MandateMaterials {
  positiveResourceNames: string[];
  negativeResourceNames: string[];
  planetImportsAndExports: ImportsAndExports;
}

// A mandate asks for one of two things: to send out a positive resource, or to take in a negative
// one. Nobody owns it when it is made, so nobody has completed it either.
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
