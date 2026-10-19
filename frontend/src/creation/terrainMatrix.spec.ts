import { describe, it, expect } from "vitest";
import { createTerrainMatrix, ELEVATION_SQUARE_COUNTS, FEWEST_SEA_SQUARES, MOST_SEA_SQUARES } from "./terrainMatrix";
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

// How many maps are drawn when what is looked at is what every map has to hold, however the draws
// happen to fall.
const MAPS_LOOKED_AT = 200;

const LAND_GROUND = { biome: "temperate", isOnLand: true, isDesert: false, isForest: false };
const SEA_GROUND = { biome: "temperate", isOnLand: false, isDesert: false, isForest: false };
const DESERT_GROUND = { biome: "temperate", isOnLand: true, isDesert: true, isForest: false };

describe("createTerrainMatrix", () => {
  // The terrain covers the map and no more of it: a matrix wider than the sektor describes ground
  // which is not there.
  it("lays the terrain out over the whole of the sektor's map and no further", () => {
    const terrain = createTerrainMatrix(SEA_GROUND, Math.random);

    expect({ rows: terrain.length, rowLengths: [...new Set(terrain.map(row => row.length))] })
      .toEqual({ rows: SEKTOR_SIZE, rowLengths: [SEKTOR_SIZE] });
  });

  // A sektor standing on the planet's land is inland, however the draws fall.
  it("lays no sea on any map of a sektor standing on land", () => {
    const seaSquareCounts = landMapsDrawn()
      .map(terrain => squaresOfSea(terrain).length)
      .filter(seaSquareCount => seaSquareCount > 0);

    expect(seaSquareCounts).toEqual([]);
  });

  // A sektor on the sea is sea with a coast on it, so its sea is one body of water which runs in
  // from the rim rather than a scattering of pools.
  it("makes the sea of every map of a sektor on the sea one body of water touching the edge of the map", () => {
    expect(mapsWhoseSeaIsNotOneBodyComingInFromTheEdge()).toEqual([]);
  });

  it("covers 70% to 90% of every map of a sektor on the sea with sea", () => {
    expect(seaMapsWithSeaOutsideTheRange()).toEqual([]);
  });

  // A sektor on the sea has too little land left for a river to run through.
  it("runs no river through any map of a sektor on the sea", () => {
    const riverSquareCounts = seaMapsDrawn()
      .map(terrain => squaresOfRiver(terrain).length)
      .filter(riverSquareCount => riverSquareCount > 0);

    expect(riverSquareCounts).toEqual([]);
  });

  // The desert has no water to run a river.
  it("runs no river through any map of a sektor in the desert", () => {
    const riverSquareCounts = desertMapsDrawn()
      .map(terrain => squaresOfRiver(terrain).length)
      .filter(riverSquareCount => riverSquareCount > 0);

    expect(riverSquareCounts).toEqual([]);
  });

  // A sektor on land is dry throughout, so the helping of elevation it is given always has the room
  // to stand.
  it("gives every map of a sektor on land one of the helpings of elevation there are", () => {
    expect(mapsWithElevationOfNoHelping()).toEqual([]);
  });

  it("raises no rock out of the sea of a sektor on the sea", () => {
    expect(mapsWithRockStandingInTheSea()).toEqual([]);
  });

  // Whether a sektor on land has a river is a toss of a coin, so among many maps there are some
  // with a river and some without.
  it("runs a river through some maps of sektors on land and not through others", () => {
    const riverSquareCounts = landMapsDrawn().map(terrain => squaresOfRiver(terrain).length);

    expect({
      someWithRiver: riverSquareCounts.some(count => count > 0),
      someWithoutRiver: riverSquareCounts.some(count => count === 0),
    }).toEqual({ someWithRiver: true, someWithoutRiver: true });
  });

  // A river is one line of squares, each of them flowed into from the one before it, and the first
  // of them flowed into from over the rim of the map: a river neither forks nor starts in the
  // middle of the land, and there is never more than one of it.
  it("makes the river of every map one unforked line of squares coming in over the rim", () => {
    expect(mapsWhoseRiverIsNotOneLineFromTheRim()).toEqual([]);
  });

  // The river comes in over the rim where the land meets it, not where the sea does.
  it("brings the river of every map in over the rim away from the sea", () => {
    expect(mapsWhoseRiverComesInFromTheCoast()).toEqual([]);
  });

  // A river runs a good way across the land, or there is none at all.
  it("makes the river of every map at least eight squares long", () => {
    expect(mapsWithRiverShorterThanEightSquares()).toEqual([]);
  });

  // A river ends where it reaches the sea or the rim of the map, never in the middle of dry land.
  it("ends the river of every map at the sea or at the rim of the map", () => {
    expect(mapsWhoseRiverEndsInTheLand()).toEqual([]);
  });

  // A river never comes back round to run alongside itself: no square of it touches any of its
  // squares but the one before it and the one after it.
  it("never lets the river of a map touch itself", () => {
    expect(mapsWhoseRiverTouchesItself()).toEqual([]);
  });
});

// Which way a square of river was flowed into, and so where the square before it lies.
const FLOWED_IN_FROM: { [riverSquare: number]: [number, number] } = {
  [RIVER_FROM_NORTH]: [0, -1],
  [RIVER_FROM_WEST]: [-1, 0],
  [RIVER_FROM_EAST]: [1, 0],
  [RIVER_FROM_SOUTH]: [0, 1],
};

// Every map drawn whose river has a square flowed into from a square of land which is not river,
// has more than one square flowed into from over the rim, or has a square flowed out of into
// more than one other.
function mapsWhoseRiverIsNotOneLineFromTheRim(): object[] {
  return landMapsDrawn().flatMap(terrain => {
    const riverSquares = squaresOfRiver(terrain);
    if (riverSquares.length === 0) return [];

    const squaresBefore = riverSquares.map(square => squareBefore(terrain, square));
    const flowedIntoFromLand = squaresBefore.filter(before => isOnTheMap(before) && !isRiver(terrain[before[0]][before[1]]));
    const sources = squaresBefore.filter(before => !isOnTheMap(before)).length;
    const forks = squaresBefore
      .filter(isOnTheMap)
      .map(([x, z]) => `${x},${z}`)
      .filter((before, index, all) => all.indexOf(before) !== index);

    return flowedIntoFromLand.length === 0 && sources === 1 && forks.length === 0
      ? []
      : [{ riverSquares, flowedIntoFromLand, sources, forks }];
  });
}

function mapsWhoseRiverComesInFromTheCoast(): object[] {
  return landMapsDrawn().flatMap(terrain => {
    const source = squaresOfRiver(terrain).find(square => !isOnTheMap(squareBefore(terrain, square)));
    if (!source) return [];

    return touchesSea(terrain, source) ? [{ source }] : [];
  });
}

function mapsWithRiverShorterThanEightSquares(): object[] {
  return landMapsDrawn().flatMap(terrain => {
    const riverSquares = squaresOfRiver(terrain);
    return riverSquares.length === 0 || riverSquares.length >= 8 ? [] : [{ riverSquares }];
  });
}

// The last square of a river is the one no other square of it was flowed into from.
function mapsWhoseRiverEndsInTheLand(): object[] {
  return landMapsDrawn().flatMap(terrain => {
    const riverSquares = squaresOfRiver(terrain);
    if (riverSquares.length === 0) return [];

    const squaresBefore = riverSquares.map(square => squareBefore(terrain, square).join(","));
    const mouth = riverSquares.find(square => !squaresBefore.includes(square.join(",")))!;

    return touchesSea(terrain, mouth) || isOnRim(mouth) ? [] : [{ riverSquares, mouth }];
  });
}

function mapsWhoseRiverTouchesItself(): object[] {
  return landMapsDrawn().flatMap(terrain => {
    const riverSquares = squaresOfRiver(terrain);

    const touchingItself = riverSquares.filter(square => {
      const riverTouching = squaresTouching(square).filter(([x, z]) => isRiver(terrain[x]?.[z]));
      const flowingOnOrBefore = riverTouching.filter(touching =>
        squareBefore(terrain, square).join(",") === touching.join(",")
        || squareBefore(terrain, touching).join(",") === square.join(",")
      );
      return riverTouching.length !== flowingOnOrBefore.length;
    });

    return touchingItself.length === 0 ? [] : [{ riverSquares, touchingItself }];
  });
}

function squareBefore(terrain: number[][], [x, z]: [number, number]): [number, number] {
  const [alongX, alongZ] = FLOWED_IN_FROM[terrain[x][z]];
  return [x + alongX, z + alongZ];
}

function touchesSea(terrain: number[][], square: [number, number]): boolean {
  return squaresTouching(square).some(([x, z]) => terrain[x]?.[z] === SEA);
}

function squaresTouching([x, z]: [number, number]): [number, number][] {
  return [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]];
}

function isOnTheMap([x, z]: [number, number]): boolean {
  return x >= 0 && x < SEKTOR_SIZE && z >= 0 && z < SEKTOR_SIZE;
}

function isOnRim([x, z]: [number, number]): boolean {
  return x === 0 || z === 0 || x === SEKTOR_SIZE - 1 || z === SEKTOR_SIZE - 1;
}

function squaresOfRiver(terrain: number[][]): [number, number][] {
  return terrain.flatMap((row, x) =>
    row.flatMap((square, z): [number, number][] => isRiver(square) ? [[x, z]] : [])
  );
}

// Every map drawn whose sea is in more than one piece, or which has sea nowhere on its rim.
function mapsWhoseSeaIsNotOneBodyComingInFromTheEdge(): object[] {
  return seaMapsDrawn().flatMap(terrain => {
    const seaSquares = squaresOfSea(terrain);
    if (seaSquares.length === 0) return [];

    const oneBody = seaReachableFrom(seaSquares[0], terrain).length === seaSquares.length;
    const onTheEdge = seaSquares.some(([x, z]) =>
      x === 0 || z === 0 || x === SEKTOR_SIZE - 1 || z === SEKTOR_SIZE - 1
    );

    return oneBody && onTheEdge ? [] : [{ seaSquares, oneBody, onTheEdge }];
  });
}

function seaMapsWithSeaOutsideTheRange(): object[] {
  return seaMapsDrawn()
    .map(terrain => squaresOfSea(terrain).length)
    .filter(seaSquareCount => seaSquareCount < FEWEST_SEA_SQUARES || seaSquareCount > MOST_SEA_SQUARES)
    .map(seaSquareCount => ({ seaSquareCount }));
}

function mapsWithElevationOfNoHelping(): object[] {
  return landMapsDrawn()
    .map(terrain => squaresOf(terrain, ELEVATION).length)
    .filter(elevationSquareCount => !ELEVATION_SQUARE_COUNTS.includes(elevationSquareCount))
    .map(elevationSquareCount => ({ elevationSquareCount }));
}

// Every map drawn which has a square counted as both sea and rock, which no square can be. A
// square is one thing or the other, so a map whose squares add up to more than the map holds has
// let the rock stand in the water. A square of river is neither, and is counted on its own.
function mapsWithRockStandingInTheSea(): object[] {
  return seaMapsDrawn().flatMap(terrain => {
    const squareCount = SEKTOR_SIZE * SEKTOR_SIZE;
    const counted = squaresOf(terrain, GROUND).length
      + squaresOf(terrain, SEA).length
      + squaresOf(terrain, ELEVATION).length
      + squaresOfRiver(terrain).length;

    return counted === squareCount ? [] : [{ counted, squareCount }];
  });
}

function landMapsDrawn(): number[][][] {
  return Array.from({ length: MAPS_LOOKED_AT }, () => createTerrainMatrix(LAND_GROUND, Math.random));
}

function seaMapsDrawn(): number[][][] {
  return Array.from({ length: MAPS_LOOKED_AT }, () => createTerrainMatrix(SEA_GROUND, Math.random));
}

function desertMapsDrawn(): number[][][] {
  return Array.from({ length: MAPS_LOOKED_AT }, () => createTerrainMatrix(DESERT_GROUND, Math.random));
}

function squaresOfSea(terrain: number[][]): [number, number][] {
  return squaresOf(terrain, SEA);
}

function squaresOf(terrain: number[][], madeOf: number): [number, number][] {
  return terrain.flatMap((row, x) =>
    row.flatMap((square, z): [number, number][] => square === madeOf ? [[x, z]] : [])
  );
}

// Every square of sea a walk over the water reaches from the square given, stepping only between
// squares sharing a side. Sea meeting only at a corner is two bodies of water, so a walk never
// crosses there.
function seaReachableFrom([startX, startZ]: [number, number], terrain: number[][]): string[] {
  const reached = new Set<string>([`${startX},${startZ}`]);
  const toWalkFrom: [number, number][] = [[startX, startZ]];

  while (toWalkFrom.length > 0) {
    const [x, z] = toWalkFrom.pop()!;
    for (const [alongX, alongZ] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const [nextX, nextZ] = [x + alongX, z + alongZ];
      if (terrain[nextX]?.[nextZ] !== SEA) continue;
      if (reached.has(`${nextX},${nextZ}`)) continue;
      reached.add(`${nextX},${nextZ}`);
      toWalkFrom.push([nextX, nextZ]);
    }
  }

  return [...reached];
}
