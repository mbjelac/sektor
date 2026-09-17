// Ground is not raised at random: it is built out of mountains. A mountain starts as a peak — a
// lone one, or a line of them making a range — and the ground falls away from it step by step until
// it is back down to the lowest there is or has run off the map. A step down is almost always a
// single one, so hillsides are walkable and the cliffs a bigger step leaves are something a map has
// here and there rather than everywhere. A sektor is given a handful of mountains at most and often
// none at all, and how much of the map they bury is whatever their own heights and the steps they
// come down in make it. Where two of them grow into one another the higher ground stands.

import { MIN_ALTITUDE } from "../../../shared/altitude";
import { SEKTOR_SIZE } from "../../../shared/sektorSize";
import { RandomNumber } from "./randomNumber";

// A tile of the sektor's map, by how far along and across it lies.
interface Tile {
  x: number;
  z: number;
}

// How many mountains a sektor is given, and how likely each number of them is. A map carrying none
// is no likelier than one carrying one, and four is the most any of them holds.
const MOUNTAIN_COUNT_CHANCES: { count: number; chance: number }[] = [
  { count: 0, chance: 0.25 },
  { count: 1, chance: 0.25 },
  { count: 2, chance: 0.2 },
  { count: 3, chance: 0.2 },
  { count: 4, chance: 0.1 },
];

// How likely a mountain is to be drawn each height there is, from the lowest peak to the highest.
// The taller the mountain the rarer it is, so a map is mostly hills and a peak at the very top of
// the range is something a player seldom sees. A peak standing a single step above the ground is
// not a mountain at all, so none is drawn.
const PEAK_ALTITUDE_CHANCES: { altitude: number; chance: number }[] = [
  { altitude: 2, chance: 0.2 },
  { altitude: 3, chance: 0.25 },
  { altitude: 4, chance: 0.15 },
  { altitude: 5, chance: 0.15 },
  { altitude: 6, chance: 0.1 },
  { altitude: 7, chance: 0.05 },
  { altitude: 8, chance: 0.05 },
  { altitude: 9, chance: 0.05 },
];

// How far the ground drops from one ring of a mountain to the next, and how likely each drop is. A
// single step is what the ground nearly always takes; the bigger steps are what leaves a cliff.
const ALTITUDE_DROP_CHANCES: { drop: number; chance: number }[] = [
  { drop: 1, chance: 0.7 },
  { drop: 2, chance: 0.2 },
  { drop: 3, chance: 0.1 },
];

// How near an edge of the map a peak has to stand. The middle of a map is left to be built on, so
// mountains belong along its sides and in its corners.
export const MOST_STEPS_FROM_EDGE_TO_PEAK = 2;

// How many places a peak is looked at before one of them is built on. The place taken is whichever
// of them lies farthest from the mountains already standing, so that two mountains of a sektor are
// not raised on top of one another.
const PEAK_PLACES_LOOKED_AT = 10;

// How long a range runs, in peaks, the length being drawn anew for every range so that no two run
// the same distance across the map.
const MOUNTAIN_RANGE_CHANCE = 0.4;
const SHORTEST_MOUNTAIN_RANGE = 2;
const LONGEST_MOUNTAIN_RANGE = 5;

export function createAltitudeMatrix(randomNumber: RandomNumber): number[][] {
  const mountainCount = drawByChance(MOUNTAIN_COUNT_CHANCES, randomNumber).count;
  const peaksStandingAlready: Tile[] = [];
  let altitudes = flatGround();

  for (let mountain = 0; mountain < mountainCount; mountain++) {
    const peaks = peaksOfOneMountain(peaksStandingAlready, randomNumber);
    peaksStandingAlready.push(...peaks);
    altitudes = mountainRaisedOn(altitudes, peaks, randomNumber);
  }

  return altitudes;
}

// Where a mountain's peaks lie: a lone one, or a line of them carrying a range.
function peaksOfOneMountain(peaksStandingAlready: Tile[], randomNumber: RandomNumber): Tile[] {
  const isRange = randomNumber() < MOUNTAIN_RANGE_CHANCE;
  return isRange
    ? mountainRangePeaks(peaksStandingAlready, randomNumber)
    : [peakNearEdge(peaksStandingAlready, randomNumber)];
}

// The map as it would stand with one more mountain on it. Ground already higher than the mountain
// would make it keeps the height it has, so mountains grown into one another form one massif rather
// than cutting each other down.
function mountainRaisedOn(altitudes: number[][], peaks: Tile[], randomNumber: RandomNumber): number[][] {
  const mountain = mountainGrownFromPeaks(peaks, randomNumber);

  return altitudes.map((row, x) => row.map((altitude, z) => Math.max(altitude, mountain[x][z])));
}

// A mountain standing on its own on flat ground. It is grown outwards from its peaks: every tile
// the ground has reached passes its height on to the tiles around it, lowered by a step, and the
// growing stops where the ground has come back down to the lowest there is or has run off the map.
// A tile reached from more than one side takes the highest ground offered it, so a mountain grown
// between two peaks is a saddle rather than a seam.
function mountainGrownFromPeaks(peaks: Tile[], randomNumber: RandomNumber): number[][] {
  // Every peak of a mountain stands at the same height, so that a range is a ridge and not a row of
  // cliffs between one peak and the next.
  const peakAltitude = randomPeakAltitude(randomNumber);
  const mountain = flatGround();
  let growingEdge = peaks.filter(isOnMap);
  growingEdge.forEach(peak => mountain[peak.x][peak.z] = peakAltitude);

  while (growingEdge.length > 0) {
    const nextEdge: Tile[] = [];

    growingEdge.forEach(tile => {
      const altitudeHere = mountain[tile.x][tile.z];
      if (altitudeHere <= MIN_ALTITUDE) return;

      neighboursOf(tile).forEach(neighbour => {
        const altitudeThere = Math.max(MIN_ALTITUDE, altitudeHere - randomAltitudeDrop(randomNumber));
        if (altitudeThere <= mountain[neighbour.x][neighbour.z]) return;
        mountain[neighbour.x][neighbour.z] = altitudeThere;
        nextEdge.push(neighbour);
      });
    });

    growingEdge = nextEdge;
  }

  return mountain;
}

function flatGround(): number[][] {
  return Array.from({ length: SEKTOR_SIZE }, () => Array.from({ length: SEKTOR_SIZE }, () => MIN_ALTITUDE));
}

function randomPeakAltitude(randomNumber: RandomNumber): number {
  return drawByChance(PEAK_ALTITUDE_CHANCES, randomNumber).altitude;
}

function randomAltitudeDrop(randomNumber: RandomNumber): number {
  return drawByChance(ALTITUDE_DROP_CHANCES, randomNumber).drop;
}

// One of a list of outcomes, each drawn as often as it says it should be. The last outcome takes
// whatever the chances before it have left over, so a list adding up to a hair under one never
// comes back empty-handed.
function drawByChance<Outcome extends { chance: number }>(outcomes: Outcome[], randomNumber: RandomNumber): Outcome {
  let draw = randomNumber();

  for (const outcome of outcomes) {
    draw -= outcome.chance;
    if (draw < 0) return outcome;
  }

  return outcomes[outcomes.length - 1];
}

// The ground touching a tile on any of its eight sides, whether along a side or only at a corner,
// as far as it is ground the map has.
function neighboursOf(tile: Tile): Tile[] {
  return NEIGHBOUR_DIRECTIONS
    .map(direction => ({ x: tile.x + direction.x, z: tile.z + direction.z }))
    .filter(isOnMap);
}

const NEIGHBOUR_DIRECTIONS: Tile[] = [
  { x: -1, z: -1 }, { x: 0, z: -1 }, { x: 1, z: -1 },
  { x: -1, z: 0 }, { x: 1, z: 0 },
  { x: -1, z: 1 }, { x: 0, z: 1 }, { x: 1, z: 1 },
];

// A range runs in a line from a peak near the edge, in one of the four directions a line can run
// across a matrix. It runs only as far as the edge of the map carries it: a range which would head
// off the map, or in past the ground near the edge and into the middle, stops where it is. So a
// range which starts in a corner and heads outwards is the one peak it started from.
function mountainRangePeaks(peaksStandingAlready: Tile[], randomNumber: RandomNumber): Tile[] {
  const start = peakNearEdge(peaksStandingAlready, randomNumber);
  const direction = pickRandom(MOUNTAIN_RANGE_DIRECTIONS, randomNumber);
  const length = SHORTEST_MOUNTAIN_RANGE
    + Math.floor(randomNumber() * (LONGEST_MOUNTAIN_RANGE - SHORTEST_MOUNTAIN_RANGE + 1));

  const peaks: Tile[] = [];
  for (let step = 0; step < length; step++) {
    const peak = { x: start.x + direction.x * step, z: start.z + direction.z * step };
    if (!isOnMap(peak) || distanceToEdge(peak) > MOST_STEPS_FROM_EDGE_TO_PEAK) break;
    peaks.push(peak);
  }

  return peaks;
}

const MOUNTAIN_RANGE_DIRECTIONS: Tile[] = [{ x: 1, z: 0 }, { x: 0, z: 1 }, { x: 1, z: 1 }, { x: 1, z: -1 }];

// A peak belongs near an edge of the map, and away from whatever mountains are standing already. So
// a handful of places along the sides and in the corners are looked at, and the one lying farthest
// from the nearest peak already raised is built on. The first mountain of a sektor has the whole
// edge of the map to choose from.
function peakNearEdge(peaksStandingAlready: Tile[], randomNumber: RandomNumber): Tile {
  const placesLookedAt = Array.from({ length: PEAK_PLACES_LOOKED_AT }, () => randomTileNearEdge(randomNumber));

  return placesLookedAt.reduce((farthest, place) =>
    distanceToNearestPeak(place, peaksStandingAlready) > distanceToNearestPeak(farthest, peaksStandingAlready)
      ? place
      : farthest
  );
}

// How far a tile lies from the nearest mountain already raised, counted in steps taken any which
// way. Ground with no mountain near it at all is as far from one as the map allows.
function distanceToNearestPeak(tile: Tile, peaks: Tile[]): number {
  return peaks.reduce(
    (nearest, peak) => Math.min(nearest, Math.max(Math.abs(tile.x - peak.x), Math.abs(tile.z - peak.z))),
    SEKTOR_SIZE,
  );
}

function randomTileNearEdge(randomNumber: RandomNumber): Tile {
  return pickRandom(TILES_NEAR_EDGE, randomNumber);
}

// Every tile of the map standing near enough an edge to carry a peak, which is the whole of it bar
// the middle.
const TILES_NEAR_EDGE: Tile[] = Array.from({ length: SEKTOR_SIZE }, (_unused, x) =>
  Array.from({ length: SEKTOR_SIZE }, (_alsoUnused, z) => ({ x, z })))
  .flat()
  .filter(tile => distanceToEdge(tile) <= MOST_STEPS_FROM_EDGE_TO_PEAK);

function distanceToEdge(tile: Tile): number {
  return Math.min(tile.x, tile.z, SEKTOR_SIZE - 1 - tile.x, SEKTOR_SIZE - 1 - tile.z);
}

function isOnMap(tile: Tile): boolean {
  return tile.x >= 0 && tile.x < SEKTOR_SIZE && tile.z >= 0 && tile.z < SEKTOR_SIZE;
}

function pickRandom<Item>(items: Item[], randomNumber: RandomNumber): Item {
  return items[Math.floor(randomNumber() * items.length)];
}
