import { RandomNumber } from "../creation/randomNumber";
import { Mandate, MandateCriterion } from "./mandates.api";
import { ResourceProduction } from "./resourceProductions";

const LOWEST_AMOUNT = 5;
const HIGHEST_AMOUNT = 50;
const MOST_RESTRICTED_IMPORTS = 3;
// How much of what a minimum export takes to make may be imported at most, as a share of what it
// takes, drawn between these two: sometimes less than it takes, sometimes more.
const LOWEST_IMPORT_SHARE = 0.5;
const HIGHEST_IMPORT_SHARE = 1.5;
// There are few negative resources to send out or take in, so most mandates ask for positive ones.
const NEGATIVE_IMPORT_CHANCE = 0.1;
const NEGATIVE_EXPORT_CHANCE = 0.1;

// What a mandate can be made of: the resources a sektor can import and export, those doing good and
// those doing harm, and what the buildings make of what.
export interface MandateMaterials {
  positiveResourceNames: string[];
  negativeResourceNames: string[];
  productions: ResourceProduction[];
}

// A mandate asks for one of three things: to send out a positive resource while taking in only so
// much of what it is made of, to take in a negative resource, or to send out only so much of one.
// Nobody owns it when it is made, so nobody has completed it either.
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

function createCriteria(mandateMaterials: MandateMaterials, randomNumber: RandomNumber): MandateCriterion[] {
  const strategyDraw = randomNumber();
  if (mandateMaterials.negativeResourceNames.length > 0) {
    if (strategyDraw < NEGATIVE_IMPORT_CHANCE) {
      return [negativeCriterion("minimumImport", mandateMaterials.negativeResourceNames, randomNumber)];
    }
    if (strategyDraw < NEGATIVE_IMPORT_CHANCE + NEGATIVE_EXPORT_CHANCE) {
      return [negativeCriterion("maximumExport", mandateMaterials.negativeResourceNames, randomNumber)];
    }
  }
  return positiveCriteria(mandateMaterials, randomNumber);
}

function negativeCriterion(
  type: "minimumImport" | "maximumExport",
  negativeResourceNames: string[],
  randomNumber: RandomNumber,
): MandateCriterion {
  return {
    type,
    resourceName: drawnFrom(negativeResourceNames, randomNumber),
    amount: drawnAmount(randomNumber),
    completed: false,
  };
}

// A positive resource some building makes is to be sent out, and of what that building takes in to
// make it, a few are imported only so much, those it takes most of first: about as much as making the
// export takes, so that a small export never comes with a large allowance of imports, nor a large
// export with a small one.
function positiveCriteria(mandateMaterials: MandateMaterials, randomNumber: RandomNumber): MandateCriterion[] {
  const madeResourceNames = mandateMaterials.positiveResourceNames.filter(resourceName =>
    mandateMaterials.productions.some(production => production.outputName === resourceName)
  );
  if (madeResourceNames.length === 0) return [];

  const exportName = drawnFrom(madeResourceNames, randomNumber);
  const minimumExport = drawnAmount(randomNumber);
  const production = drawnFrom(
    mandateMaterials.productions.filter(production => production.outputName === exportName),
    randomNumber,
  );

  const importableInputs = production.inputs
    .filter(input => input.name !== exportName && mandateMaterials.positiveResourceNames.includes(input.name))
    .sort((input, otherInput) => otherInput.value - input.value);
  const restrictedImportCount = importableInputs.length === 0
    ? 0
    : 1 + Math.floor(randomNumber() * Math.min(MOST_RESTRICTED_IMPORTS, importableInputs.length));

  const importCriteria: MandateCriterion[] = importableInputs.slice(0, restrictedImportCount).map(input => {
    const importShare = LOWEST_IMPORT_SHARE + randomNumber() * (HIGHEST_IMPORT_SHARE - LOWEST_IMPORT_SHARE);
    return {
      type: "maximumImport",
      resourceName: input.name,
      amount: withinAmountRange(Math.round(minimumExport * input.value / production.outputAmount * importShare)),
      completed: false,
    };
  });

  return [
    { type: "minimumExport", resourceName: exportName, amount: minimumExport, completed: false },
    ...importCriteria,
  ];
}

function drawnFrom<Item>(items: Item[], randomNumber: RandomNumber): Item {
  return items[Math.floor(randomNumber() * items.length)];
}

function drawnAmount(randomNumber: RandomNumber): number {
  return LOWEST_AMOUNT + Math.floor(randomNumber() * (HIGHEST_AMOUNT - LOWEST_AMOUNT + 1));
}

function withinAmountRange(amount: number): number {
  return Math.max(LOWEST_AMOUNT, Math.min(HIGHEST_AMOUNT, amount));
}
