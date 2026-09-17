// Ground is not scattered at random: metal runs in seams, minerals lie in blotches, uranium sits in
// pockets, wind blows straight through. Every property is laid out the same way — a handful of
// hotspots, and ground which falls away from them the further it lies — and one property differs
// from another only in where its hotspots go. Insolation has no hotspots at all: until there are
// mountains to stand in the sun's way, it simply falls where it falls.

import { MODIFIER_MAX } from "../../../shared/modifierLimits";
import { SEKTOR_SIZE } from "../../../shared/sektorSize";
import { RandomNumber } from "./randomNumber";

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
// building asks for which was never described — simply falls where it falls, as insolation does.
export function createLocationPropertyMatrix(
  propertyName: string,
  minimumValue: number,
  randomNumber: RandomNumber,
): number[][] {
  const createMatrix = MATRIX_CREATORS[propertyName] ?? createScatteredMatrix;
  return createMatrix(minimumValue, randomNumber);
}

type MatrixCreator = (minimumValue: number, randomNumber: RandomNumber) => number[][];

const MATRIX_CREATORS: { [propertyName: string]: MatrixCreator } = {
  metals: createMetalsMatrix,
  minerals: createMineralsMatrix,
  uranium: createUraniumMatrix,
  insolation: createInsolationMatrix,
  wind: createWindMatrix,
  groundwater: createGroundwaterMatrix,
  soil: createSoilMatrix,
};

// Metal runs in seams: a line of ground wandering across the map, here and there two tiles wide.
const METAL_SEAM_COUNT = 2;

function createMetalsMatrix(minimumValue: number, randomNumber: RandomNumber): number[][] {
  return matrixAroundHotspots(seamHotspots(METAL_SEAM_COUNT, randomNumber), minimumValue, randomNumber);
}

// Minerals lie in large blotches, a couple to a map.
const MINERAL_BLOTCH_COUNT = 3;

function createMineralsMatrix(minimumValue: number, randomNumber: RandomNumber): number[][] {
  return matrixAroundHotspots(blobHotspots(MINERAL_BLOTCH_COUNT, 2, 0.7, randomNumber), minimumValue, randomNumber);
}

// Uranium sits in small pockets, scattered and ragged: more of them than there are mineral
// blotches, each of them a tile or two, and holes in even those.
const URANIUM_POCKET_COUNT = 5;

function createUraniumMatrix(minimumValue: number, randomNumber: RandomNumber): number[][] {
  return matrixAroundHotspots(blobHotspots(URANIUM_POCKET_COUNT, 1, 0.4, randomNumber), minimumValue, randomNumber);
}

// Nothing stands between the sun and the ground yet, so insolation falls where it falls.
function createInsolationMatrix(minimumValue: number, randomNumber: RandomNumber): number[][] {
  return createScatteredMatrix(minimumValue, randomNumber);
}

// Wind flows through the map rather than settling in it: a line clear across, from one edge to the
// other, and now and then a second one.
function createWindMatrix(minimumValue: number, randomNumber: RandomNumber): number[][] {
  return matrixAroundHotspots(
    windHotspots(randomNumber),
    Math.min(minimumValue, STRONGEST_WIND_ON_FLAT_GROUND),
    randomNumber,
    STRONGEST_WIND_ON_FLAT_GROUND,
  );
}

// What makes a place windy is standing high, so on the flat the wind is never more than middling
// and the height of the ground carries it the rest of the way: the windiest flat ground there is
// blows as hard as a property can once it stands on the highest ground there is.
export const STRONGEST_WIND_ON_FLAT_GROUND = 6;

// Groundwater gathers in pockets: smaller than mineral blotches, and several of them.
const GROUNDWATER_POCKET_COUNT = 3;

function createGroundwaterMatrix(minimumValue: number, randomNumber: RandomNumber): number[][] {
  return matrixAroundHotspots(blobHotspots(GROUNDWATER_POCKET_COUNT, 1, 0.8, randomNumber), minimumValue, randomNumber);
}

// Soil lies in the largest blobs of all, there being no rivers or hills yet to say where it is deep.
const SOIL_BLOB_COUNT = 2;

function createSoilMatrix(minimumValue: number, randomNumber: RandomNumber): number[][] {
  return matrixAroundHotspots(blobHotspots(SOIL_BLOB_COUNT, 3, 0.75, randomNumber), minimumValue, randomNumber);
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

// A band of wind is a whole row or a whole column of the map, so the wind comes in one edge and
// leaves by the other.
function windHotspots(randomNumber: RandomNumber): Hotspot[] {
  const bandCount = randomNumber() < 0.3 ? 2 : 1;
  const hotspots: Hotspot[] = [];

  for (let band = 0; band < bandCount; band++) {
    const flowsAlongX = randomNumber() < 0.5;
    const across = randomTile(randomNumber);
    for (let along = 0; along < SEKTOR_SIZE; along++) {
      hotspots.push(flowsAlongX ? { x: along, z: across } : { x: across, z: along });
    }
  }

  return hotspots;
}

// Hotspots which fell off the edge describe ground the sektor does not have, so they are dropped
// before the map is measured against them.
function matrixAroundHotspots(
  hotspots: Hotspot[],
  minimumValue: number,
  randomNumber: RandomNumber,
  maximumValue: number = MODIFIER_MAX,
): number[][] {
  const hotspotsOnMap = hotspots.filter(hotspot => isOnMap(hotspot.x, hotspot.z));

  return Array.from({ length: SEKTOR_SIZE }, (_, x) =>
    Array.from({ length: SEKTOR_SIZE }, (_, z) =>
      scaledToRange(
        valueNearHotspots(distanceToNearestHotspot(x, z, hotspotsOnMap), randomNumber),
        minimumValue,
        maximumValue,
      )
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

// A property the sektor is solved with holds something on every location, and one which the ground
// alone never holds much of holds no more than its own most, so what the pattern says is stretched
// to sit between the two. The shape of the pattern survives the stretching: what was richest is
// still richest.
function scaledToRange(value: number, minimumValue: number, maximumValue: number): number {
  return minimumValue + Math.round(value * (maximumValue - minimumValue) / MODIFIER_MAX);
}

// Ground with no pattern to it: every location takes whatever value it likes.
function createScatteredMatrix(minimumValue: number, randomNumber: RandomNumber): number[][] {
  return Array.from({ length: SEKTOR_SIZE }, () =>
    Array.from({ length: SEKTOR_SIZE }, () =>
      minimumValue + Math.floor(randomNumber() * (MODIFIER_MAX - minimumValue + 1))
    )
  );
}

function randomTile(randomNumber: RandomNumber): number {
  return Math.floor(randomNumber() * SEKTOR_SIZE);
}

function isOnMap(x: number, z: number): boolean {
  return x >= 0 && x < SEKTOR_SIZE && z >= 0 && z < SEKTOR_SIZE;
}
