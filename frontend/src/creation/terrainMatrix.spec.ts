import { describe, it, expect } from "vitest";
import { createTerrainMatrix, ELEVATION_SQUARE_COUNTS, SEA_SQUARE_COUNTS } from "./terrainMatrix";
import { SEKTOR_SIZE } from "../../../shared/sektorSize";
import { ELEVATION, GROUND, SEA } from "../../../shared/terrain";

// How many maps are drawn when what is looked at is what every map has to hold, however the draws
// happen to fall.
const MAPS_LOOKED_AT = 200;

describe("createTerrainMatrix", () => {
  // The terrain covers the map and no more of it: a matrix wider than the sektor describes ground
  // which is not there.
  it("lays the terrain out over the whole of the sektor's map and no further", () => {
    const terrain = createTerrainMatrix(Math.random);

    expect({ rows: terrain.length, rowLengths: [...new Set(terrain.map(row => row.length))] })
      .toEqual({ rows: SEKTOR_SIZE, rowLengths: [SEKTOR_SIZE] });
  });

  it("leaves the whole map dry when the draw asks for no sea at all", () => {
    const terrain = createTerrainMatrix(() => 0);

    expect(terrain).toEqual(Array.from({ length: SEKTOR_SIZE }, () =>
      Array.from({ length: SEKTOR_SIZE }, () => GROUND)
    ));
  });

  // A sektor is land with a coast on it, so whatever sea a map is given is one body of water which
  // runs in from the rim rather than a scattering of pools in the middle.
  it("makes the sea of every map one body of water touching the edge of the map", () => {
    expect(mapsWhoseSeaIsNotOneBodyComingInFromTheEdge()).toEqual([]);
  });

  // The sea comes in helpings rather than in any amount at all: none of the map, a quarter of it,
  // or half of it.
  it("gives every map one of the helpings of sea there are", () => {
    expect(mapsWithSeaOfNoHelping()).toEqual([]);
  });

  // Rock stands on dry land, so the helping of elevation a map is given is counted out of the
  // squares the sea has left rather than out of the map as a whole.
  it("gives every map one of the helpings of elevation there are", () => {
    expect(mapsWithElevationOfNoHelping()).toEqual([]);
  });

  it("raises no rock out of the sea", () => {
    expect(mapsWithRockStandingInTheSea()).toEqual([]);
  });
});

// Every map drawn whose sea is in more than one piece, or which has sea nowhere on its rim. A map
// with no sea at all has nothing to answer for, so it is not among them.
function mapsWhoseSeaIsNotOneBodyComingInFromTheEdge(): object[] {
  return mapsDrawn().flatMap(terrain => {
    const seaSquares = squaresOfSea(terrain);
    if (seaSquares.length === 0) return [];

    const oneBody = seaReachableFrom(seaSquares[0], terrain).length === seaSquares.length;
    const onTheEdge = seaSquares.some(([x, z]) =>
      x === 0 || z === 0 || x === SEKTOR_SIZE - 1 || z === SEKTOR_SIZE - 1
    );

    return oneBody && onTheEdge ? [] : [{ seaSquares, oneBody, onTheEdge }];
  });
}

function mapsWithSeaOfNoHelping(): object[] {
  return mapsDrawn()
    .map(terrain => squaresOfSea(terrain).length)
    .filter(seaSquareCount => !SEA_SQUARE_COUNTS.includes(seaSquareCount))
    .map(seaSquareCount => ({ seaSquareCount }));
}

function mapsWithElevationOfNoHelping(): object[] {
  return mapsDrawn()
    .map(terrain => squaresOf(terrain, ELEVATION).length)
    .filter(elevationSquareCount => !ELEVATION_SQUARE_COUNTS.includes(elevationSquareCount))
    .map(elevationSquareCount => ({ elevationSquareCount }));
}

// Every map drawn which has a square counted as both sea and rock, which no square can be. A
// square is one thing or the other, so a map whose squares add up to more than the map holds has
// let the rock stand in the water.
function mapsWithRockStandingInTheSea(): object[] {
  return mapsDrawn().flatMap(terrain => {
    const squareCount = SEKTOR_SIZE * SEKTOR_SIZE;
    const counted = squaresOf(terrain, GROUND).length
      + squaresOf(terrain, SEA).length
      + squaresOf(terrain, ELEVATION).length;

    return counted === squareCount ? [] : [{ counted, squareCount }];
  });
}

function mapsDrawn(): number[][][] {
  return Array.from({ length: MAPS_LOOKED_AT }, () => createTerrainMatrix(Math.random));
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
