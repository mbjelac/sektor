// A sektor is not all dry land: a piece of it is sea. The sea is one body of water rather than a
// scattering of puddles, and it runs in from an edge of the map rather than sitting in the middle
// of it, so that the water a sektor has reads as a coast. How much of the map it takes is drawn
// anew for every sektor, out of the few helpings there are.

import { SEKTOR_SIZE } from "../../../shared/sektorSize";
import { GROUND, SEA } from "../../../shared/terrain";
import { RandomNumber } from "./randomNumber";

// A square of the sektor's map, by how far along and across it lies.
interface Square {
  x: number;
  z: number;
}

// How much of the map the sea takes, each helping as likely as the next: a sektor is dry land
// throughout, has a quarter of it under water, or half of it.
export const SEA_SQUARE_COUNTS = [
  0,
  Math.round(SEKTOR_SIZE * SEKTOR_SIZE / 4),
  Math.round(SEKTOR_SIZE * SEKTOR_SIZE / 2),
];

export function createTerrainMatrix(randomNumber: RandomNumber): number[][] {
  const terrain = allGround();
  const seaSquareCount = randomSeaSquareCount(randomNumber);
  if (seaSquareCount === 0) return terrain;

  // The sea starts on an edge of the map and spreads a square at a time into the ground touching
  // it, so however far it reaches it stays one body of water with a coastline on the rim.
  const sea = [randomSquareOnEdge(randomNumber)];
  terrain[sea[0].x][sea[0].z] = SEA;

  while (sea.length < seaSquareCount) {
    const flooded = randomSquareTheSeaCanSpreadTo(terrain, sea, randomNumber);
    if (!flooded) break;
    terrain[flooded.x][flooded.z] = SEA;
    sea.push(flooded);
  }

  return terrain;
}

function allGround(): number[][] {
  return Array.from({ length: SEKTOR_SIZE }, () => Array.from({ length: SEKTOR_SIZE }, () => GROUND));
}

function randomSeaSquareCount(randomNumber: RandomNumber): number {
  return SEA_SQUARE_COUNTS[Math.floor(randomNumber() * SEA_SQUARE_COUNTS.length)];
}

function randomSquareOnEdge(randomNumber: RandomNumber): Square {
  return SQUARES_ON_EDGE[Math.floor(randomNumber() * SQUARES_ON_EDGE.length)];
}

// Every square of the map lying on its rim, which is where the sea comes in from.
const SQUARES_ON_EDGE: Square[] = Array.from({ length: SEKTOR_SIZE }, (_unused, x) =>
  Array.from({ length: SEKTOR_SIZE }, (_alsoUnused, z) => ({ x, z })))
  .flat()
  .filter(square => square.x === 0 || square.z === 0 || square.x === SEKTOR_SIZE - 1 || square.z === SEKTOR_SIZE - 1);

// Where the sea spreads next: any dry square touching the water it has already covered, drawn at
// random so that a coastline is ragged rather than a block. A square touching the sea on more than
// one side is still one square to draw, or the water would fill its own bays before reaching out
// and come back round. There is nowhere left to spread to only once the whole map is under water.
function randomSquareTheSeaCanSpreadTo(terrain: number[][], sea: Square[], randomNumber: RandomNumber): Square | null {
  const coast = new Map<string, Square>();
  for (const seaSquare of sea) {
    for (const square of squaresTouching(seaSquare)) {
      if (terrain[square.x][square.z] !== GROUND) continue;
      coast.set(`${square.x},${square.z}`, square);
    }
  }
  if (coast.size === 0) return null;

  return [...coast.values()][Math.floor(randomNumber() * coast.size)];
}

// The squares a square shares a side with, as far as they are squares the map has. Squares meeting
// only at a corner are not touching: water which spread that way would be two bodies pinched
// together rather than one.
function squaresTouching(square: Square): Square[] {
  return SIDES
    .map(side => ({ x: square.x + side.x, z: square.z + side.z }))
    .filter(isOnMap);
}

const SIDES: Square[] = [{ x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 }];

function isOnMap(square: Square): boolean {
  return square.x >= 0 && square.x < SEKTOR_SIZE && square.z >= 0 && square.z < SEKTOR_SIZE;
}
