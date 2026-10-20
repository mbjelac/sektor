// Ground is not scattered at random: metal runs in seams, minerals lie in blotches, uranium sits in
// pockets, wind blows straight through. Every property is laid out the same way — a handful of
// hotspots, and ground which falls away from them the further it lies — and one property differs
// from another only in where its hotspots go. Insolation goes by the biome instead: the desert and
// the sea lie open to the sun all alike, and forest and grassland let it through in pockets.

import { MODIFIER_MAX, MODIFIER_MIN } from "../../../shared/modifierLimits";
import { SEKTOR_SIZE } from "../../../shared/sektorSize";
import { RandomNumber } from "./randomNumber";
import { groundCover, GroundCover, SektorGround } from "./terrainMatrix";

// A tile of the sektor's map which holds a lot of the property, by how far along and across it lies.
interface Hotspot {
  x: number;
  z: number;
}

// How far out a hotspot is still felt. Ground beyond this holds only what is found anywhere.
const HOTSPOT_REACH = 3;
// The most that barren ground ever holds.
const BACKGROUND_MAX = 2;

// A property the game knows the shape of is laid out in that shape. One it does not — a property a
// building asks for which was never described — simply falls where it falls.
export function createLocationPropertyMatrix(
  propertyName: string,
  ground: SektorGround,
  randomNumber: RandomNumber,
): number[][] {
  const createMatrix = MATRIX_CREATORS[propertyName] ?? createScatteredMatrix;
  return createMatrix(randomNumber, ground);
}

type MatrixCreator = (randomNumber: RandomNumber, ground: SektorGround) => number[][];

const MATRIX_CREATORS: { [propertyName: string]: MatrixCreator } = {
  metals: createMetalsMatrix,
  minerals: createMineralsMatrix,
  uranium: createUraniumMatrix,
  insolation: createInsolationMatrix,
  wind: createWindMatrix,
  groundwater: createGroundwaterMatrix,
  soil: createSoilMatrix,
  pollution: createUnpollutedMatrix,
};

// Metal runs in seams: a line of ground wandering across the map, here and there two tiles wide.
const METAL_SEAM_COUNT = 2;

function createMetalsMatrix(randomNumber: RandomNumber): number[][] {
  return matrixAroundHotspots(seamHotspots(METAL_SEAM_COUNT, randomNumber), randomNumber);
}

// Minerals lie in large blotches, a couple to a map.
const MINERAL_BLOTCH_COUNT = 3;

function createMineralsMatrix(randomNumber: RandomNumber): number[][] {
  return matrixAroundHotspots(blobHotspots(MINERAL_BLOTCH_COUNT, 2, 0.7, randomNumber), randomNumber);
}

// Uranium sits in small pockets, scattered and ragged: more of them than there are mineral
// blotches, each of them a tile or two, and holes in even those.
const URANIUM_POCKET_COUNT = 5;

function createUraniumMatrix(randomNumber: RandomNumber): number[][] {
  return matrixAroundHotspots(blobHotspots(URANIUM_POCKET_COUNT, 1, 0.4, randomNumber), randomNumber);
}

// How much sun a location sees goes by the biome: least near the poles. The desert and the sea
// have nothing standing over them, so the whole map sees the same. Forest and grassland are lit in
// pockets — clearings, open ground — brightest at the middle of a pocket and darker square by
// square away from it: forest has more pockets, but the trees close in on them fast, while the
// light of grassland pockets falls away slowly.
export const INSOLATION_BY_BIOME: { [cover in GroundCover]: { [biome: string]: number } } = {
  desert: { tropical: 12, temperate: 8, polar: 2 },
  sea: { tropical: 10, temperate: 6, polar: 1 },
  forest: { tropical: 12, temperate: 8, polar: 1 },
  grassland: { tropical: 12, temperate: 8, polar: 1 },
};

// How many pockets of sunlight forest and grassland have, and how much darker each square away
// from the middle of one is.
export const SUNLIGHT_POCKETS: { [cover in "forest" | "grassland"]: { fewest: number; most: number; fallOffPerSquare: number } } = {
  forest: { fewest: 6, most: 10, fallOffPerSquare: 4 },
  grassland: { fewest: 4, most: 8, fallOffPerSquare: 2 },
};

function createInsolationMatrix(randomNumber: RandomNumber, ground: SektorGround): number[][] {
  const cover = groundCover(ground);
  const brightest = INSOLATION_BY_BIOME[cover][ground.biome] ?? INSOLATION_BY_BIOME[cover].temperate;
  if (cover === "desert" || cover === "sea") return matrixAllOf(brightest);

  const { fewest, most, fallOffPerSquare } = SUNLIGHT_POCKETS[cover];
  const pocketCount = fewest + Math.floor(randomNumber() * (most - fewest + 1));
  return matrixOfPockets(pocketCount, brightest, fallOffPerSquare, randomNumber);
}

// Wind flows through the map rather than settling in it: it runs in tracks, each a whole row or a
// whole column clear across from one edge to the other, all of them running the same way. A track
// blows as hard as the wind blows there, and the rows beside it less the further from it they lie.
// Nothing stands in the way of the wind over the desert and the sea; trees break it, forest more
// than grassland, and the temperate lands are the calmest.
export const WIND_BY_BIOME: { [cover in GroundCover]: { [biome: string]: number } } = {
  desert: { tropical: 12, temperate: 12, polar: 12 },
  sea: { tropical: 12, temperate: 12, polar: 12 },
  forest: { tropical: 8, temperate: 6, polar: 8 },
  grassland: { tropical: 10, temperate: 8, polar: 10 },
};

export const FEWEST_WIND_TRACKS = 1;
export const MOST_WIND_TRACKS = 3;
// How much less the wind blows for every row away from the nearest track.
export const WIND_FALL_OFF_PER_ROW = 3;

function createWindMatrix(randomNumber: RandomNumber, ground: SektorGround): number[][] {
  const cover = groundCover(ground);
  const strongest = WIND_BY_BIOME[cover][ground.biome] ?? WIND_BY_BIOME[cover].temperate;
  const runsAlongX = randomNumber() < 0.5;
  const tracks = windTrackRows(randomNumber);
  return Array.from({ length: SEKTOR_SIZE }, (_, x) =>
    Array.from({ length: SEKTOR_SIZE }, (_, z) => {
      const row = runsAlongX ? z : x;
      const rowsFromTrack = Math.min(...tracks.map(track => Math.abs(track - row)));
      return Math.max(0, strongest - WIND_FALL_OFF_PER_ROW * rowsFromTrack);
    })
  );
}

// Which rows of the map the tracks run along: no two along the same one, so there are as many
// tracks as were drawn.
function windTrackRows(randomNumber: RandomNumber): number[] {
  const trackCount = FEWEST_WIND_TRACKS + Math.floor(randomNumber() * (MOST_WIND_TRACKS - FEWEST_WIND_TRACKS + 1));
  const rows = Array.from({ length: SEKTOR_SIZE }, (_, row) => row);
  return Array.from({ length: trackCount }, () => rows.splice(Math.floor(randomNumber() * rows.length), 1)[0]);
}

// Pollution is what buildings leave behind, not what the ground starts with: a sektor just made has
// had nothing standing in it to foul it, so every location of it is clean.
function createUnpollutedMatrix(): number[][] {
  return matrixAllOf(0);
}

// Groundwater gathers in pockets, as full as ground ever is at the middle of one and drying up
// square by square away from it. How many pockets there are goes by the biome: the desert mostly
// has none, the sea a few, and wet lands and forests more than dry lands and grassland.
export const GROUNDWATER_FALL_OFF_PER_SQUARE = 4;

// How likely the desert is to have no pocket, one, or two.
export const DESERT_GROUNDWATER_POCKET_CHANCES = [0.5, 0.3, 0.2];

export const GROUNDWATER_POCKETS: { [cover in "sea" | "forest" | "grassland"]: { [biome: string]: { fewest: number; most: number } } } = {
  sea: { tropical: { fewest: 1, most: 3 }, temperate: { fewest: 1, most: 3 }, polar: { fewest: 1, most: 3 } },
  forest: { tropical: { fewest: 8, most: 15 }, temperate: { fewest: 5, most: 10 }, polar: { fewest: 3, most: 8 } },
  grassland: { tropical: { fewest: 6, most: 12 }, temperate: { fewest: 4, most: 8 }, polar: { fewest: 0, most: 5 } },
};

function createGroundwaterMatrix(randomNumber: RandomNumber, ground: SektorGround): number[][] {
  return matrixOfPockets(groundwaterPocketCount(ground, randomNumber), MODIFIER_MAX, GROUNDWATER_FALL_OFF_PER_SQUARE, randomNumber);
}

function groundwaterPocketCount(ground: SektorGround, randomNumber: RandomNumber): number {
  const cover = groundCover(ground);
  if (cover === "desert") return countDrawnByChances(DESERT_GROUNDWATER_POCKET_CHANCES, randomNumber());
  const { fewest, most } = GROUNDWATER_POCKETS[cover][ground.biome] ?? GROUNDWATER_POCKETS[cover].temperate;
  return fewest + Math.floor(randomNumber() * (most - fewest + 1));
}

// The chances of every count, from none up, laid end to end: the count is the one the draw falls on.
function countDrawnByChances(chances: number[], draw: number): number {
  let chanceSoFar = 0;
  for (let count = 0; count < chances.length; count++) {
    chanceSoFar += chances[count];
    if (draw < chanceSoFar) return count;
  }
  return chances.length - 1;
}

// Soil lies in the largest blobs of all, there being no rivers or hills yet to say where it is deep.
// How rich it gets goes by the biome: the cold leaves soil thin, and the desert has none at all.
// The blobs are laid out the same everywhere and only scaled down to the richest soil there is.
const SOIL_BLOB_COUNT = 2;

export const RICHEST_SOIL_BY_BIOME: { [biome: string]: number } = { tropical: 12, temperate: 12, polar: 4 };

function createSoilMatrix(randomNumber: RandomNumber, ground: SektorGround): number[][] {
  const richest = groundCover(ground) === "desert" ? 0 : RICHEST_SOIL_BY_BIOME[ground.biome] ?? RICHEST_SOIL_BY_BIOME.temperate;
  return matrixAroundHotspots(blobHotspots(SOIL_BLOB_COUNT, 3, 0.75, randomNumber), randomNumber)
    .map(row => row.map(value => Math.round(value * richest / MODIFIER_MAX)));
}

// Pockets of a property: the middle of each holds the most there is of it, and every square away
// from the nearest middle holds less by the fall-off, down to none at all.
function matrixOfPockets(pocketCount: number, highest: number, fallOffPerSquare: number, randomNumber: RandomNumber): number[][] {
  const pockets = pocketMiddles(pocketCount, randomNumber);
  return Array.from({ length: SEKTOR_SIZE }, (_, x) =>
    Array.from({ length: SEKTOR_SIZE }, (_, z) =>
      Math.max(0, Math.round(highest - fallOffPerSquare * distanceToNearestHotspot(x, z, pockets))))
  );
}

// No two pockets share a middle, so there are as many pockets on the map as were drawn.
function pocketMiddles(pocketCount: number, randomNumber: RandomNumber): Hotspot[] {
  const tiles = Array.from({ length: SEKTOR_SIZE * SEKTOR_SIZE }, (_, index) =>
    ({ x: Math.floor(index / SEKTOR_SIZE), z: index % SEKTOR_SIZE }));
  return Array.from({ length: pocketCount }, () => tiles.splice(Math.floor(randomNumber() * tiles.length), 1)[0]);
}

// A seam starts somewhere on the map and keeps going one way until it runs off the far edge,
// wandering a tile to either side as it goes and thickening here and there.
function seamHotspots(seamCount: number, randomNumber: RandomNumber): Hotspot[] {
  const hotspots: Hotspot[] = [];

  for (let seam = 0; seam < seamCount; seam++) {
    const runsAlongX = randomNumber() < 0.5;
    let x = randomTile(randomNumber);
    let z = randomTile(randomNumber);

    for (let step = 0; step < SEKTOR_SIZE; step++) {
      hotspots.push({ x, z });
      if (randomNumber() < 0.4) hotspots.push(runsAlongX ? { x, z: z + 1 } : { x: x + 1, z });

      const wander = randomNumber() < 0.3 ? (randomNumber() < 0.5 ? -1 : 1) : 0;
      if (runsAlongX) {
        x += 1;
        z += wander;
      } else {
        z += 1;
        x += wander;
      }
    }
  }

  return hotspots;
}

// A blob is the ground within reach of a centre, with holes in it where the property did not take:
// the denser it is the fewer the holes. The centre itself always holds, so every blob is somewhere.
function blobHotspots(
  blobCount: number,
  radius: number,
  denseness: number,
  randomNumber: RandomNumber,
): Hotspot[] {
  const hotspots: Hotspot[] = [];

  for (let blob = 0; blob < blobCount; blob++) {
    const centerX = randomTile(randomNumber);
    const centerZ = randomTile(randomNumber);
    hotspots.push({ x: centerX, z: centerZ });

    for (let x = centerX - radius; x <= centerX + radius; x++) {
      for (let z = centerZ - radius; z <= centerZ + radius; z++) {
        if (x === centerX && z === centerZ) continue;
        if (distanceBetween(x, z, centerX, centerZ) > radius) continue;
        if (randomNumber() > denseness) continue;
        hotspots.push({ x, z });
      }
    }
  }

  return hotspots;
}

// Hotspots which fell off the edge describe ground the sektor does not have, so they are dropped
// before the map is measured against them.
function matrixAroundHotspots(hotspots: Hotspot[], randomNumber: RandomNumber): number[][] {
  const hotspotsOnMap = hotspots.filter(hotspot => isOnMap(hotspot.x, hotspot.z));

  return Array.from({ length: SEKTOR_SIZE }, (_, x) =>
    Array.from({ length: SEKTOR_SIZE }, (_, z) =>
      valueNearHotspots(distanceToNearestHotspot(x, z, hotspotsOnMap), randomNumber)
    )
  );
}

// A hotspot holds nearly all there is of the property, and the ground around it holds less the
// further out it lies, unevenly: the further out, the more the falling off varies from tile to
// tile. Out of the hotspot's reach there is only the little which is found anywhere.
function valueNearHotspots(distance: number, randomNumber: RandomNumber): number {
  const background = Math.floor(randomNumber() * (BACKGROUND_MAX + 1));
  if (distance >= HOTSPOT_REACH) return background;

  const peak = MODIFIER_MAX - Math.floor(randomNumber() * 3);
  const falling = Math.round(peak * (1 - distance / HOTSPOT_REACH)) - Math.floor(randomNumber() * (distance + 1));

  return Math.max(background, falling);
}

function distanceToNearestHotspot(x: number, z: number, hotspots: Hotspot[]): number {
  return hotspots.reduce(
    (nearest, hotspot) => Math.min(nearest, distanceBetween(x, z, hotspot.x, hotspot.z)),
    Number.POSITIVE_INFINITY,
  );
}

function distanceBetween(fromX: number, fromZ: number, toX: number, toZ: number): number {
  return Math.sqrt((fromX - toX) ** 2 + (fromZ - toZ) ** 2);
}

// Ground with no pattern to it: every location takes whatever value it likes.
function createScatteredMatrix(randomNumber: RandomNumber): number[][] {
  return matrixOfValuesBetween(MODIFIER_MIN, MODIFIER_MAX, randomNumber);
}

// A map whose every location is drawn on its own, between the two values given and including them.
function matrixOfValuesBetween(lowest: number, highest: number, randomNumber: RandomNumber): number[][] {
  return Array.from({ length: SEKTOR_SIZE }, () =>
    Array.from({ length: SEKTOR_SIZE }, () => lowest + Math.floor(randomNumber() * (highest - lowest + 1)))
  );
}

function matrixAllOf(value: number): number[][] {
  return Array.from({ length: SEKTOR_SIZE }, () => Array.from({ length: SEKTOR_SIZE }, () => value));
}

function randomTile(randomNumber: RandomNumber): number {
  return Math.floor(randomNumber() * SEKTOR_SIZE);
}

function isOnMap(x: number, z: number): boolean {
  return x >= 0 && x < SEKTOR_SIZE && z >= 0 && z < SEKTOR_SIZE;
}
