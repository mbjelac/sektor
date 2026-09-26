// Trees stand on some of the dry land of a sektor from the start. Every square of plain ground has
// the same chance of holding a forest, whatever grows around it.

import { Building } from "../../../shared/sektorData";
import { GROUND } from "../../../shared/terrain";
import { FOREST_NAME } from "../sektor/forest";
import { RandomNumber } from "./randomNumber";

// How likely a square of plain ground is to hold a forest.
export const FOREST_CHANCE = 0.1;

// Neither the sea nor the rock grows anything, so only plain ground is drawn for.
export function plantForests(terrain: number[][], randomNumber: RandomNumber): Building[] {
  return terrain.flatMap((row, x) => row.flatMap((square, y) =>
    square === GROUND && randomNumber() < FOREST_CHANCE
      ? [{ type: FOREST_NAME, location: { x, y } }]
      : []));
}
