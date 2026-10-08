// A sektor is not all dry land: a piece of it is sea. The sea is one body of water rather than a
// scattering of puddles, and it runs in from an edge of the map rather than sitting in the middle
// of it, so that the water a sektor has reads as a coast. How much of the map it takes is drawn
// anew for every sektor, out of the few helpings there are.
//
// Half of all sektors have a river running through them. It comes in over the rim of the map where
// the land meets it, wanders across the land a square at a time, and runs out again into the sea or
// over the rim.
//
// What is left over is not all flat either: rock stands out of the dry land here and there, which
// a player builds around as they do the sea.

import { SEKTOR_SIZE } from "../../../shared/sektorSize";
import {
  ELEVATION,
  GROUND,
  isRiver,
  RIVER_FROM_EAST,
  RIVER_FROM_NORTH,
  RIVER_FROM_SOUTH,
  RIVER_FROM_WEST,
  SEA,
} from "../../../shared/terrain";
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

// How much of the map stands up as rock, each helping as likely as the next: none of it, a tenth
// of it, or a fifth.
export const ELEVATION_SQUARE_COUNTS = [
  0,
  Math.round(SEKTOR_SIZE * SEKTOR_SIZE / 10),
  Math.round(SEKTOR_SIZE * SEKTOR_SIZE / 5),
];

export function createTerrainMatrix(randomNumber: RandomNumber): number[][] {
  const terrain = allGround();
  floodWithSea(terrain, randomNumber);
  runRiver(terrain, randomNumber);
  raiseElevations(terrain, randomNumber);
  return terrain;
}

function floodWithSea(terrain: number[][], randomNumber: RandomNumber) {
  const seaSquareCount = randomSeaSquareCount(randomNumber);
  if (seaSquareCount === 0) return;

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
}

// A draw falling below this leaves the sektor without a river.
const CHANCE_OF_NO_RIVER = 0.5;

// A river is a river only if it runs a good way across the land: one which comes in over the rim and
// runs straight out into the sea or over the rim again a few squares on is taken away and another
// one run in its place. A map with too little land between its rim and its sea may have room for
// no river that long, so after enough tries it is left without one.
function runRiver(terrain: number[][], randomNumber: RandomNumber) {
  if (randomNumber() < CHANCE_OF_NO_RIVER) return;

  const sources = RIVER_SOURCES.filter(source =>
    terrain[source.square.x][source.square.z] === GROUND && !touchesSea(terrain, source.square)
  );
  if (sources.length === 0) return;

  for (let attempt = 0; attempt < RIVER_ATTEMPTS; attempt++) {
    runRiverFromRandomSource(terrain, sources, randomNumber);
    if (squaresOfRiver(terrain).length >= SHORTEST_RIVER_SQUARE_COUNT) return;
    for (const square of squaresOfRiver(terrain)) {
      terrain[square.x][square.z] = GROUND;
    }
  }
}

// The fewest squares a river runs across.
const SHORTEST_RIVER_SQUARE_COUNT = 8;

// How many rivers are run before a map is taken to have no room for one long enough.
const RIVER_ATTEMPTS = 100;

// A river comes in over the rim from one of the squares of land lying on it. A square of the rim
// which already touches the sea is the coast rather than the rim, and no river comes in from there.
function runRiverFromRandomSource(terrain: number[][], sources: RiverSource[], randomNumber: RandomNumber) {
  const source = sources[Math.floor(randomNumber() * sources.length)];
  terrain[source.square.x][source.square.z] = source.flow.riverSquare;
  // The river comes in from over the rim, so its first step takes it straight into the land rather
  // than along the rim it has just crossed.
  flowOnward(terrain, source.square, [source.flow], randomNumber);
}

function squaresOfRiver(terrain: number[][]): Square[] {
  return terrain.flatMap((row, x) => row.flatMap((square, z) => isRiver(square) ? [{ x, z }] : []));
}

// The river flows on from the square it has reached, into the next square straight ahead, to the
// left or to the right, whichever the draw falls on first. A way which runs it into a corner with
// nowhere left to go is taken back and another one tried, so that every river ends in the sea or
// over the rim rather than in the middle of the land. Whether it got there is what is answered.
function flowOnward(terrain: number[][], square: Square, flows: Flow[], randomNumber: RandomNumber): boolean {
  for (const flow of inRandomOrder(flows, randomNumber)) {
    const next = { x: square.x + flow.x, z: square.z + flow.z };
    if (!canRiverFlowInto(terrain, next, square)) continue;

    terrain[next.x][next.z] = flow.riverSquare;
    if (isRiverMouth(terrain, next)) return true;
    if (flowOnward(terrain, next, flowsStraightOrTurning(flow), randomNumber)) return true;
    terrain[next.x][next.z] = GROUND;
  }
  return false;
}

// A river flows only over land, and never back into itself: the square it flows into touches no
// river but the square it flows in from, or the river would come round to run alongside itself.
function canRiverFlowInto(terrain: number[][], square: Square, flowingFrom: Square): boolean {
  if (!isOnMap(square) || terrain[square.x][square.z] !== GROUND) return false;
  return squaresTouching(square).every(touching =>
    !isRiver(terrain[touching.x][touching.z]) || (touching.x === flowingFrom.x && touching.z === flowingFrom.z)
  );
}

// A river ends where it reaches the sea, or where it reaches the rim of the map and runs out over it.
function isRiverMouth(terrain: number[][], square: Square): boolean {
  return touchesSea(terrain, square) || isOnEdge(square);
}

function touchesSea(terrain: number[][], square: Square): boolean {
  return squaresTouching(square).some(touching => terrain[touching.x][touching.z] === SEA);
}

function isOnEdge(square: Square): boolean {
  return square.x === 0 || square.z === 0 || square.x === SEKTOR_SIZE - 1 || square.z === SEKTOR_SIZE - 1;
}

function inRandomOrder<Item>(items: Item[], randomNumber: RandomNumber): Item[] {
  const remaining = [...items];
  const ordered: Item[] = [];
  while (remaining.length > 0) {
    ordered.push(...remaining.splice(Math.floor(randomNumber() * remaining.length), 1));
  }
  return ordered;
}

// A step of the river from one square to the next, and what the square it steps into is marked as:
// the side of it the river came in from.
interface Flow {
  x: number;
  z: number;
  riverSquare: number;
}

const FLOWS: Flow[] = [
  { x: 0, z: 1, riverSquare: RIVER_FROM_NORTH },
  { x: 1, z: 0, riverSquare: RIVER_FROM_WEST },
  { x: -1, z: 0, riverSquare: RIVER_FROM_EAST },
  { x: 0, z: -1, riverSquare: RIVER_FROM_SOUTH },
];

// A river goes on the way it was going, or turns a quarter to either side. It never turns right
// round, which would take it straight back up itself.
function flowsStraightOrTurning(flow: Flow): Flow[] {
  return [flow, flowAlong(flow.z, -flow.x), flowAlong(-flow.z, flow.x)];
}

function flowAlong(x: number, z: number): Flow {
  return FLOWS.find(flow => flow.x === x && flow.z === z)!;
}

// Every square on the rim of the map a river can come in from, and which way it flows coming in:
// straight away from the rim. A corner lies on two sides of the rim, and a river can come in over
// either of them.
interface RiverSource {
  square: Square;
  flow: Flow;
}

const RIVER_SOURCES: RiverSource[] = Array.from({ length: SEKTOR_SIZE }, (_unused, x) =>
  Array.from({ length: SEKTOR_SIZE }, (_alsoUnused, z) => ({ x, z })))
  .flat()
  .flatMap(square => FLOWS
    .filter(flow => !isOnMap({ x: square.x - flow.x, z: square.z - flow.z }))
    .map(flow => ({ square, flow })));

// Rock stands where it stands: elevation has no shape of its own and is scattered over whatever
// dry land the sea has left, never twice on the same square.
function raiseElevations(terrain: number[][], randomNumber: RandomNumber) {
  const elevationSquareCount = randomElevationSquareCount(randomNumber);
  const dryLand = squaresOfDryLand(terrain);

  for (let raised = 0; raised < elevationSquareCount && dryLand.length > 0; raised++) {
    const [square] = dryLand.splice(Math.floor(randomNumber() * dryLand.length), 1);
    terrain[square.x][square.z] = ELEVATION;
  }
}

function squaresOfDryLand(terrain: number[][]): Square[] {
  return terrain.flatMap((row, x) => row.flatMap((square, z) => square === GROUND ? [{ x, z }] : []));
}

function allGround(): number[][] {
  return Array.from({ length: SEKTOR_SIZE }, () => Array.from({ length: SEKTOR_SIZE }, () => GROUND));
}

function randomSeaSquareCount(randomNumber: RandomNumber): number {
  return SEA_SQUARE_COUNTS[Math.floor(randomNumber() * SEA_SQUARE_COUNTS.length)];
}

function randomElevationSquareCount(randomNumber: RandomNumber): number {
  return ELEVATION_SQUARE_COUNTS[Math.floor(randomNumber() * ELEVATION_SQUARE_COUNTS.length)];
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
