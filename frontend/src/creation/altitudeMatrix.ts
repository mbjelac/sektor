// Ground is not raised at random: it is built out of mountains. A lone mountain is a single peak
// with the ground falling away from it on every side; a range is a line of higher peaks carrying the
// same skirt, falling away more steeply. Mountains are raised one at a time onto flat ground until
// enough of the map is buried, and where two of them overlap the higher one stands.

import { MIN_ALTITUDE } from "../../../shared/altitude";
import { RandomNumber } from "./randomNumber";

// A tile of the sektor's map, by how far along and across it lies.
interface Tile {
  x: number;
  z: number;
}

// What the ground stands at, by how far it lies from the nearest peak: the first list is the peak
// itself, the next the ground around it, the next the ground around that. Beyond the lists the
// mountain is not felt at all. Which of a list's altitudes a tile takes is drawn at random, so no
// two sides of a mountain fall away quite alike.
type MountainFalloff = number[][];

const LONE_MOUNTAIN_FALLOFF: MountainFalloff = [[2, 3], [1, 2], [0, 1]];
const MOUNTAIN_RANGE_FALLOFF: MountainFalloff = [[3, 4], [1, 2, 3], [0, 1, 2]];

// How much of a sektor's ground lies flat. A sektor of any difficulty may turn out all plain — what
// its difficulty settles is how much of it may be buried at most, the first few levels each giving
// up another tenth of the map and every level from the fourth on sharing the same floor. Ground
// which is not flat is ground some buildings cannot stand on, so the harder the sektor the more of
// it may be closed to them.
const ALL_FLAT = 1;
const LEAST_FLAT_SHARE_BY_LEVEL = [0.7, 0.6, 0.5];
const LEAST_FLAT_SHARE = 0.4;

// A range needs room to run, so the smallest maps are given lone mountains only. A tiny sektor then
// typically carries the one lone mountain, its peak on an edge or in a corner.
const SMALLEST_MAP_WITH_RANGES = 6;
const MOUNTAIN_RANGE_CHANCE = 0.4;
const SHORTEST_MOUNTAIN_RANGE = 2;

// How many mountains may be tried before the map is left as it stands. A mountain which falls
// entirely on ground already raised buries nothing new, and one which would bury too much is turned
// down, so the building of them has to be able to give up.
const MOST_MOUNTAIN_ATTEMPTS = 40;

export function createAltitudeMatrix(size: number, level: number, randomNumber: RandomNumber): number[][] {
  const leastFlat = leastFlatShare(level);
  // How much of this sektor in particular is left flat is drawn from the whole of the range its
  // difficulty allows, so that two sektors of a level are not the same amount of mountain and one
  // now and then is all plain. A bigger map takes more mountains to bury the same share of itself,
  // which is how its size comes into how many it ends up carrying.
  const wantedFlatShare = leastFlat + randomNumber() * (ALL_FLAT - leastFlat);
  let altitudes = flatGround(size);

  for (let attempt = 0; attempt < MOST_MOUNTAIN_ATTEMPTS; attempt++) {
    if (flatShare(altitudes) <= wantedFlatShare) break;

    const raised = mountainRaisedOn(altitudes, size, randomNumber);
    // A mountain which would leave the sektor with less flat ground than its difficulty allows is
    // never built, and another is tried in its place.
    if (flatShare(raised) < leastFlat) continue;

    altitudes = raised;
  }

  return altitudes;
}

function leastFlatShare(level: number): number {
  return LEAST_FLAT_SHARE_BY_LEVEL[Math.max(0, level - 1)] ?? LEAST_FLAT_SHARE;
}

function flatGround(size: number): number[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => MIN_ALTITUDE));
}

function flatShare(altitudes: number[][]): number {
  const allAltitudes = altitudes.flat();
  return allAltitudes.filter(altitude => altitude === MIN_ALTITUDE).length / allAltitudes.length;
}

// The map as it would stand with one more mountain on it. Ground already higher than the mountain
// would make it keeps the height it has, so mountains grown into one another form one massif rather
// than cutting each other down.
function mountainRaisedOn(altitudes: number[][], size: number, randomNumber: RandomNumber): number[][] {
  const isRange = size >= SMALLEST_MAP_WITH_RANGES && randomNumber() < MOUNTAIN_RANGE_CHANCE;
  const peaks = isRange ? mountainRangePeaks(size, randomNumber) : [peakNearEdge(size, randomNumber)];
  const falloff = isRange ? MOUNTAIN_RANGE_FALLOFF : LONE_MOUNTAIN_FALLOFF;

  return altitudes.map((row, x) => row.map((altitude, z) => {
    const distanceFromPeak = distanceToNearestPeak(x, z, peaks);
    if (distanceFromPeak >= falloff.length) return altitude;
    return Math.max(altitude, pickRandom(falloff[distanceFromPeak], randomNumber));
  }));
}

// A range runs in a line from a peak near the edge, in one of the four directions a line can run
// across a matrix. Whatever runs off the map is simply not there, so a range which starts in a
// corner and heads outwards is the one peak it started from.
function mountainRangePeaks(size: number, randomNumber: RandomNumber): Tile[] {
  const start = peakNearEdge(size, randomNumber);
  const direction = pickRandom(MOUNTAIN_RANGE_DIRECTIONS, randomNumber);
  const length = SHORTEST_MOUNTAIN_RANGE + Math.floor(randomNumber() * (size / 3));

  const peaks: Tile[] = [];
  for (let step = 0; step < length; step++) {
    const peak = { x: start.x + direction.x * step, z: start.z + direction.z * step };
    if (!isOnMap(peak, size)) break;
    peaks.push(peak);
  }

  return peaks;
}

const MOUNTAIN_RANGE_DIRECTIONS: Tile[] = [{ x: 1, z: 0 }, { x: 0, z: 1 }, { x: 1, z: 1 }, { x: 1, z: -1 }];

// A peak belongs near the edge of the map rather than in the middle of it, so two locations are
// drawn and the one lying nearer an edge is the one built on. An edge tile itself is as good a peak
// as any, and the middle of the map is still possible, just seldom.
function peakNearEdge(size: number, randomNumber: RandomNumber): Tile {
  const firstDraw = randomTile(size, randomNumber);
  const secondDraw = randomTile(size, randomNumber);
  return distanceToEdge(firstDraw, size) <= distanceToEdge(secondDraw, size) ? firstDraw : secondDraw;
}

function distanceToEdge(tile: Tile, size: number): number {
  return Math.min(tile.x, tile.z, size - 1 - tile.x, size - 1 - tile.z);
}

function randomTile(size: number, randomNumber: RandomNumber): Tile {
  return {
    x: Math.floor(randomNumber() * size),
    z: Math.floor(randomNumber() * size),
  };
}

// How far out from the mountain a tile lies, counted in rings: the ground touching a peak on any of
// its eight sides is one ring out, whether it touches along a side or only at a corner.
function distanceToNearestPeak(x: number, z: number, peaks: Tile[]): number {
  return peaks.reduce(
    (nearest, peak) => Math.min(nearest, Math.max(Math.abs(x - peak.x), Math.abs(z - peak.z))),
    Number.POSITIVE_INFINITY,
  );
}

function isOnMap(tile: Tile, size: number): boolean {
  return tile.x >= 0 && tile.x < size && tile.z >= 0 && tile.z < size;
}

function pickRandom<Item>(items: Item[], randomNumber: RandomNumber): Item {
  return items[Math.floor(randomNumber() * items.length)];
}
