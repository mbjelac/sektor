// Ground is not scattered at random: metal runs in seams, minerals lie in blotches, uranium sits in
// pockets, wind blows straight through. Every property is laid out the same way — a handful of
// hotspots, and ground which falls away from them the further it lies — and one property differs
// from another only in where its hotspots go. Insolation has no hotspots at all: until there are
// mountains to stand in the sun's way, it simply falls where it falls.

import { MODIFIER_MAX } from "../../../shared/modifierLimits";
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
  size: number,
  minimumValue: number,
  randomNumber: RandomNumber,
): number[][] {
  const createMatrix = MATRIX_CREATORS[propertyName] ?? createScatteredMatrix;
  return createMatrix(size, minimumValue, randomNumber);
}

type MatrixCreator = (size: number, minimumValue: number, randomNumber: RandomNumber) => number[][];

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
function createMetalsMatrix(size: number, minimumValue: number, randomNumber: RandomNumber): number[][] {
  const seamCount = Math.max(1, Math.round(size / 5));
  return matrixAroundHotspots(seamHotspots(seamCount, size, randomNumber), size, minimumValue, randomNumber);
}

// Minerals lie in large blotches, a couple to a map.
function createMineralsMatrix(size: number, minimumValue: number, randomNumber: RandomNumber): number[][] {
  const blotchCount = Math.max(1, Math.round(size / 4));
  return matrixAroundHotspots(blobHotspots(blotchCount, 2, 0.7, size, randomNumber), size, minimumValue, randomNumber);
}

// Uranium sits in small pockets, scattered and ragged: more of them than there are mineral
// blotches, each of them a tile or two, and holes in even those.
function createUraniumMatrix(size: number, minimumValue: number, randomNumber: RandomNumber): number[][] {
  const pocketCount = Math.max(2, Math.round(size / 2));
  return matrixAroundHotspots(blobHotspots(pocketCount, 1, 0.4, size, randomNumber), size, minimumValue, randomNumber);
}

// Nothing stands between the sun and the ground yet, so insolation falls where it falls.
function createInsolationMatrix(size: number, minimumValue: number, randomNumber: RandomNumber): number[][] {
  return createScatteredMatrix(size, minimumValue, randomNumber);
}

// Wind flows through the map rather than settling in it: a line clear across, from one edge to the
// other, and now and then a second one.
function createWindMatrix(size: number, minimumValue: number, randomNumber: RandomNumber): number[][] {
  return matrixAroundHotspots(
    windHotspots(size, randomNumber),
    size,
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
function createGroundwaterMatrix(size: number, minimumValue: number, randomNumber: RandomNumber): number[][] {
  const pocketCount = Math.max(2, Math.round(size / 3));
  return matrixAroundHotspots(blobHotspots(pocketCount, 1, 0.8, size, randomNumber), size, minimumValue, randomNumber);
}

// Soil lies in the largest blobs of all, there being no rivers or hills yet to say where it is deep.
function createSoilMatrix(size: number, minimumValue: number, randomNumber: RandomNumber): number[][] {
  const blobCount = Math.max(1, Math.round(size / 5));
  return matrixAroundHotspots(blobHotspots(blobCount, 3, 0.75, size, randomNumber), size, minimumValue, randomNumber);
}

// A seam starts somewhere on the map and keeps going one way until it runs off the far edge,
// wandering a tile to either side as it goes and thickening here and there.
function seamHotspots(seamCount: number, size: number, randomNumber: RandomNumber): Hotspot[] {
  const hotspots: Hotspot[] = [];

  for (let seam = 0; seam < seamCount; seam++) {
    const runsAlongX = randomNumber() < 0.5;
    let x = randomTile(size, randomNumber);
    let z = randomTile(size, randomNumber);

    for (let step = 0; step < size; step++) {
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
  size: number,
  randomNumber: RandomNumber,
): Hotspot[] {
  const hotspots: Hotspot[] = [];

  for (let blob = 0; blob < blobCount; blob++) {
    const centerX = randomTile(size, randomNumber);
    const centerZ = randomTile(size, randomNumber);
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
function windHotspots(size: number, randomNumber: RandomNumber): Hotspot[] {
  const bandCount = randomNumber() < 0.3 ? 2 : 1;
  const hotspots: Hotspot[] = [];

  for (let band = 0; band < bandCount; band++) {
    const flowsAlongX = randomNumber() < 0.5;
    const across = randomTile(size, randomNumber);
    for (let along = 0; along < size; along++) {
      hotspots.push(flowsAlongX ? { x: along, z: across } : { x: across, z: along });
    }
  }

  return hotspots;
}

// Hotspots which fell off the edge describe ground the sektor does not have, so they are dropped
// before the map is measured against them.
function matrixAroundHotspots(
  hotspots: Hotspot[],
  size: number,
  minimumValue: number,
  randomNumber: RandomNumber,
  maximumValue: number = MODIFIER_MAX,
): number[][] {
  const hotspotsOnMap = hotspots.filter(hotspot => isOnMap(hotspot.x, hotspot.z, size));

  return Array.from({ length: size }, (_, x) =>
    Array.from({ length: size }, (_, z) =>
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
function createScatteredMatrix(size: number, minimumValue: number, randomNumber: RandomNumber): number[][] {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () =>
      minimumValue + Math.floor(randomNumber() * (MODIFIER_MAX - minimumValue + 1))
    )
  );
}

function randomTile(size: number, randomNumber: RandomNumber): number {
  return Math.floor(randomNumber() * size);
}

function isOnMap(x: number, z: number, size: number): boolean {
  return x >= 0 && x < size && z >= 0 && z < size;
}
