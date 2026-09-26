// Trees stand on some of the dry land of a sektor from the start. Every square of plain ground may
// be where a forest starts, and a forest bigger than one square spreads from there into the ground
// around it.

import { Building, BuildingLocation } from "../../../shared/sektorData";
import { GROUND } from "../../../shared/terrain";
import { FOREST_NAME } from "../sektor/forest";
import { RandomNumber } from "./randomNumber";

// How many squares a forest covers, and how likely a square is to be where a forest that size starts.
export const FOREST_CHANCES = [
  { size: 3, chance: 0.1 },
  { size: 2, chance: 0.1 },
  { size: 1, chance: 0.1 },
];

// Neither the sea nor the rock grows anything, and a square which a forest has already spread onto
// holds that forest, so only plain ground no forest has taken is drawn for.
export function plantForests(terrain: number[][], randomNumber: RandomNumber): Building[] {
  const forestSquares: BuildingLocation[] = [];
  terrain.forEach((row, x) => row.forEach((square, y) => {
    if (square !== GROUND || isAmong(forestSquares, { x, y })) return;
    const forestSize = drawnForestSize(randomNumber());
    if (forestSize === 0) return;
    forestSquares.push(...growForest(terrain, forestSquares, { x, y }, forestSize, randomNumber));
  }));
  return forestSquares.map(location => ({ type: FOREST_NAME, location }));
}

// A square starts one forest at most, so a single draw decides which, if any: the chances of the
// sizes are laid end to end, and a draw past all of them starts none.
function drawnForestSize(draw: number): number {
  let chanceSoFar = 0;
  for (const forestChance of FOREST_CHANCES) {
    chanceSoFar += forestChance.chance;
    if (draw < chanceSoFar) return forestChance.size;
  }
  return 0;
}

// A forest is one stand of trees rather than a scattering of them: it spreads from the square it
// starts on a square at a time into the ground touching it, taking only plain ground no other
// forest has taken. A forest with no more such ground left for it stays smaller than it was drawn.
function growForest(
  terrain: number[][],
  forestSquares: BuildingLocation[],
  startSquare: BuildingLocation,
  size: number,
  randomNumber: RandomNumber,
): BuildingLocation[] {
  const forest: BuildingLocation[] = [startSquare];
  while (forest.length < size) {
    const freeGroundTouchingForest = squaresOfFreeGround(terrain, [...forestSquares, ...forest])
      .filter(square => forest.some(forestSquare => areTouching(forestSquare, square)));
    if (freeGroundTouchingForest.length === 0) break;
    forest.push(freeGroundTouchingForest[Math.floor(randomNumber() * freeGroundTouchingForest.length)]);
  }
  return forest;
}

function squaresOfFreeGround(terrain: number[][], forestSquares: BuildingLocation[]): BuildingLocation[] {
  return terrain.flatMap((row, x) => row.flatMap((square, y) =>
    square === GROUND && !isAmong(forestSquares, { x, y }) ? [{ x, y }] : []));
}

function isAmong(squares: BuildingLocation[], square: BuildingLocation): boolean {
  return squares.some(other => other.x === square.x && other.y === square.y);
}

// Squares touch when they share a side. Squares meeting only at a corner are not touching: trees
// which spread that way would be two forests pinched together rather than one.
function areTouching(square: BuildingLocation, otherSquare: BuildingLocation): boolean {
  return Math.abs(square.x - otherSquare.x) + Math.abs(square.y - otherSquare.y) === 1;
}
