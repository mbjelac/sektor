import { RandomNumber } from "../creation/randomNumber";
import { Mandate } from "./mandates.api";

const LOWEST_AMOUNT = 5;
const HIGHEST_AMOUNT = 30;

// A mandate asks for a single thing for now: at least so much of one resource exported, the
// resource being one which can be exported at all. Nobody owns it when it is made.
export function createMandate(
  mandateNumber: number,
  exportableResourceNames: string[],
  randomNumber: RandomNumber = Math.random,
): Mandate {
  const resourceName = exportableResourceNames[Math.floor(randomNumber() * exportableResourceNames.length)];
  const amount = LOWEST_AMOUNT + Math.floor(randomNumber() * (HIGHEST_AMOUNT - LOWEST_AMOUNT + 1));

  return {
    number: mandateNumber,
    owner: null,
    criteria: [{ type: "minimumExport", resourceName, amount }],
  };
}
