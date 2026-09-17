// Ground is not raised at random: it is built out of mountains. A mountain starts as a peak — a
// lone one, or a line of them making a range — and the ground falls away from it step by step until
// it is back down to the lowest there is or has run off the map. A step down is almost always a
// single one, so hillsides are walkable and the cliffs a bigger step leaves are something a map has
// here and there rather than everywhere. A sektor is given one mountain, and how much of the map
// that buries is whatever the mountain's own height and the steps it comes down in make it.

import { MIN_ALTITUDE } from "../../../shared/altitude";
import { SEKTOR_SIZE } from "../../../shared/sektorSize";
import { RandomNumber } from "./randomNumber";

// A tile of the sektor's map, by how far along and across it lies.
interface Tile {
  x: number;
  z: number;
}

// How likely a mountain is to be drawn each height there is, from the lowest peak to the highest.
// The taller the mountain the rarer it is, so a map is mostly hills and a peak at the very top of
// the range is something a player seldom sees.
const PEAK_ALTITUDE_CHANCES: { altitude: number; chance: number }[] = [
  { altitude: 1, chance: 0.2 },
  { altitude: 2, chance: 0.2 },
  { altitude: 3, chance: 0.2 },
  { altitude: 4, chance: 0.1 },
  { altitude: 5, chance: 0.1 },
  { altitude: 6, chance: 0.05 },
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

// How long a range runs, in peaks, the length being drawn anew for every range so that no two run
// the same distance across the map.
const MOUNTAIN_RANGE_CHANCE = 0.4;
const SHORTEST_MOUNTAIN_RANGE = 2;
const LONGEST_MOUNTAIN_RANGE = 5;

export function createAltitudeMatrix(randomNumber: RandomNumber): number[][] {
  return mountainGrownFromPeaks(peaksOfOneMountain(randomNumber), randomNumber);
}

// Where a mountain's peaks lie: a lone one, or a line of them carrying a range.
function peaksOfOneMountain(randomNumber: RandomNumber): Tile[] {
  const isRange = randomNumber() < MOUNTAIN_RANGE_CHANCE;
  return isRange ? mountainRangePeaks(randomNumber) : [peakNearEdge(randomNumber)];
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
// across a matrix. Whatever runs off the map is simply not there, so a range which starts in a
// corner and heads outwards is the one peak it started from.
function mountainRangePeaks(randomNumber: RandomNumber): Tile[] {
  const start = peakNearEdge(randomNumber);
  const direction = pickRandom(MOUNTAIN_RANGE_DIRECTIONS, randomNumber);
  const length = SHORTEST_MOUNTAIN_RANGE
    + Math.floor(randomNumber() * (LONGEST_MOUNTAIN_RANGE - SHORTEST_MOUNTAIN_RANGE + 1));

  const peaks: Tile[] = [];
  for (let step = 0; step < length; step++) {
    const peak = { x: start.x + direction.x * step, z: start.z + direction.z * step };
    if (!isOnMap(peak)) break;
    peaks.push(peak);
  }

  return peaks;
}

const MOUNTAIN_RANGE_DIRECTIONS: Tile[] = [{ x: 1, z: 0 }, { x: 0, z: 1 }, { x: 1, z: 1 }, { x: 1, z: -1 }];

// A peak belongs near the edge of the map rather than in the middle of it, so two locations are
// drawn and the one lying nearer an edge is the one built on. An edge tile itself is as good a peak
// as any, and the middle of the map is still possible, just seldom.
function peakNearEdge(randomNumber: RandomNumber): Tile {
  const firstDraw = randomTile(randomNumber);
  const secondDraw = randomTile(randomNumber);
  return distanceToEdge(firstDraw) <= distanceToEdge(secondDraw) ? firstDraw : secondDraw;
}

function distanceToEdge(tile: Tile): number {
  return Math.min(tile.x, tile.z, SEKTOR_SIZE - 1 - tile.x, SEKTOR_SIZE - 1 - tile.z);
}

function randomTile(randomNumber: RandomNumber): Tile {
  return {
    x: Math.floor(randomNumber() * SEKTOR_SIZE),
    z: Math.floor(randomNumber() * SEKTOR_SIZE),
  };
}

function isOnMap(tile: Tile): boolean {
  return tile.x >= 0 && tile.x < SEKTOR_SIZE && tile.z >= 0 && tile.z < SEKTOR_SIZE;
}

function pickRandom<Item>(items: Item[], randomNumber: RandomNumber): Item {
  return items[Math.floor(randomNumber() * items.length)];
}
