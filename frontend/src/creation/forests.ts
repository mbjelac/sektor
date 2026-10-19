// Trees stand on some of the dry land of a sektor from the start. How much of its plain ground they
// cover goes by what the planet is like where the sektor lies: a forest is mostly forest, grassland
// has little of it, a sektor on the sea less still, and the desert none. Forests start on squares
// of plain ground picked at random, and a forest bigger than one square spreads from there into the
// ground around it, until as much of the ground is forest as was drawn.

import { Building, BuildingLocation } from "../../../shared/sektorData";
import { GROUND } from "../../../shared/terrain";
import { FOREST_NAME } from "../sektor/forest";
import { RandomNumber } from "./randomNumber";
import { groundCover, GroundCover, SektorGround } from "./terrainMatrix";

// The least and the most of a sektor's plain ground forests cover, by what its ground is.
export const FOREST_SHARES: { [cover in GroundCover]: { least: number; most: number } } = {
  forest: { least: 0.5, most: 0.9 },
  grassland: { least: 0, most: 0.15 },
  sea: { least: 0, most: 0.1 },
  desert: { least: 0, most: 0 },
};

// How much of a sektor's plain ground forests cover, anywhere between the least and the most its
// ground has.
export function drawForestShare(ground: SektorGround, randomNumber: RandomNumber): number {
  const { least, most } = FOREST_SHARES[groundCover(ground)];
  return least + randomNumber() * (most - least);
}

// The largest forest started at once. A forest is drawn anywhere from one square up to this.
const LARGEST_FOREST_SIZE = 3;

// Neither the sea nor the rock grows anything, so only plain ground is planted. Forests are started
// on ground no forest has taken until they cover the share of it they were drawn to, the last of
// them stopping short of its size if that is what it takes to cover no more.
export function plantForests(terrain: number[][], forestShare: number, randomNumber: RandomNumber): Building[] {
  const forestSquareCount = Math.round(forestShare * squaresOfFreeGround(terrain, []).length);
  const forestSquares: BuildingLocation[] = [];
  while (forestSquares.length < forestSquareCount) {
    const freeGround = squaresOfFreeGround(terrain, forestSquares);
    const startSquare = freeGround[Math.floor(randomNumber() * freeGround.length)];
    const forestSize = Math.min(1 + Math.floor(randomNumber() * LARGEST_FOREST_SIZE), forestSquareCount - forestSquares.length);
    forestSquares.push(...growForest(terrain, forestSquares, startSquare, forestSize, randomNumber));
  }
  return forestSquares.map(location => ({ type: FOREST_NAME, location }));
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
