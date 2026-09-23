import { SektorData } from "../../../shared/sektorData";
import { createLocationPropertyMatrix } from "./locationPropertyMatrices";
import { RandomNumber } from "./randomNumber";

export type { RandomNumber };

// A sektor is the ground it stands on and nothing else: it is handed to the player as a piece of
// land with a difficulty on it, and what is worth building there is theirs to work out. Nothing is
// asked of them, so nothing has to be laid out in advance to be sure the asking can be answered.
export function createSektor(
  level: number,
  locationPropertyNames: string[],
  randomNumber: RandomNumber = Math.random,
): SektorData {
  return {
    level,
    locationProperties: createLocationProperties(locationPropertyNames, randomNumber),
    buildings: [],
  };
}

// The ground of a sektor is made of every property there is, whether or not a building in this
// sektor draws on it. What each of them holds is whatever its own shape makes it: the sektor is
// built out of the ground it was given rather than the ground being bent to suit the sektor.
function createLocationProperties(
  locationPropertyNames: string[],
  randomNumber: RandomNumber,
): { [key: string]: number[][] } {
  return Object.fromEntries(
    locationPropertyNames.map(propertyName => [
      propertyName,
      createLocationPropertyMatrix(propertyName, randomNumber),
    ])
  );
}
