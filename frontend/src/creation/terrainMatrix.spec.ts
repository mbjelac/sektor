import { describe, it, expect } from "vitest";
import {
  createTerrainMatrix,
  ELEVATION_SHARES_OF_LAND,
  FEWEST_LAND_SQUARES_ON_SEA,
  FEWEST_SEA_SQUARES_BEHIND_COASTAL_EDGE,
  FEWEST_SEA_SQUARES_ON_COASTAL_EDGE,
  MOST_LAND_SQUARES_ON_SEA,
  MOST_SEA_SQUARES_BEHIND_COASTAL_EDGE,
  MOST_SEA_SQUARES_ON_COASTAL_EDGE,
  SektorGround,
} from "./terrainMatrix";
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

const LAND_GROUND = { biome: "temperate", isOnLand: true, isDesert: false, isForest: false, coastalEdges: [] };
const SEA_GROUND = { biome: "temperate", isOnLand: false, isDesert: false, isForest: false, coastalEdges: [] };
const DESERT_GROUND = { biome: "temperate", isOnLand: true, isDesert: true, isForest: false, coastalEdges: [] };
const NORTH_COAST_GROUND = { ...LAND_GROUND, coastalEdges: ["north" as const] };
const SOUTH_AND_WEST_COAST_GROUND = { ...LAND_GROUND, coastalEdges: ["south" as const, "west" as const] };

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

  // A sektor on the sea has its land scattered over the whole map rather than along one side, so
  // among many maps every square of the map is land on some of them.
  it("scatters the land of sektors on the sea anywhere over the map", () => {
    expect(squaresNeverLandOnTheSea()).toEqual([]);
  });

  // The land of a sektor on the sea is every square the sea leaves, rock included.
  it("leaves 3 to 10 squares of land on every map of a sektor on the sea", () => {
    expect(seaMapsWithLandOutsideTheRange()).toEqual([]);
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

  // Rock stands only on land, so its helping is a share of the land: of the squares which are
  // neither sea nor river.
  it("raises one of the shares of the land there are as rock on every map", () => {
    expect(mapsWithElevationOfNoShareOfLand()).toEqual([]);
  });

  it("raises no rock out of the sea of a sektor on the sea", () => {
    expect(mapsWithRockStandingInTheSea()).toEqual([]);
  });

  // A sektor on land next to the sea has a coast along the edge of its map facing the sea: most of
  // the edge is sea, and a few of the squares right behind the sea of the edge.
  it("lays 6 to 9 squares of sea on an edge facing the sea, and 1 to 3 right behind them", () => {
    expect(mapsWhoseNorthCoastIsOutOfShape()).toEqual([]);
  });

  it("lays a coast along every edge facing the sea and no sea anywhere else", () => {
    expect(mapsWithSeaAwayFromTheirSouthAndWestCoasts()).toEqual([]);
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

// Every square of the map which is sea on every map of a sektor on the sea drawn.
function squaresNeverLandOnTheSea(): [number, number][] {
  const maps = seaMapsDrawn();
  return squaresOf(allSea(), SEA).filter(([x, z]) => maps.every(terrain => terrain[x]![z] === SEA));
}

function allSea(): number[][] {
  return Array.from({ length: SEKTOR_SIZE }, () => Array.from({ length: SEKTOR_SIZE }, () => SEA));
}

function seaMapsWithLandOutsideTheRange(): object[] {
  return seaMapsDrawn()
    .map(terrain => SEKTOR_SIZE * SEKTOR_SIZE - squaresOfSea(terrain).length)
    .filter(landSquareCount => landSquareCount < FEWEST_LAND_SQUARES_ON_SEA || landSquareCount > MOST_LAND_SQUARES_ON_SEA)
    .map(landSquareCount => ({ landSquareCount }));
}

// Every map drawn, on land or on the sea, whose rock is none of the shares of its land there are.
// The land is every square the rock stands on and every square of ground left beside it.
function mapsWithElevationOfNoShareOfLand(): object[] {
  return [...landMapsDrawn(), ...seaMapsDrawn()].flatMap(terrain => {
    const elevationSquareCount = squaresOf(terrain, ELEVATION).length;
    const landSquareCount = elevationSquareCount + squaresOf(terrain, GROUND).length;
    const elevationSquareCounts = ELEVATION_SHARES_OF_LAND.map(shareOfLand => Math.round(landSquareCount * shareOfLand));

    return elevationSquareCounts.includes(elevationSquareCount)
      ? []
      : [{ landSquareCount, elevationSquareCount, elevationSquareCounts }];
  });
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

// Every map drawn with a coast on its north edge, where z is 0, whose edge or the strip right behind
// it holds too much or too little sea, whose strip has sea with no sea in front of it on the edge,
// or which has sea further in.
function mapsWhoseNorthCoastIsOutOfShape(): object[] {
  return mapsDrawn(NORTH_COAST_GROUND).flatMap(terrain => {
    const seaSquares = squaresOfSea(terrain);
    const seaOnEdge = seaSquares.filter(([, z]) => z === 0);
    const seaBehindEdge = seaSquares.filter(([, z]) => z === 1);
    const seaBehindLand = seaBehindEdge.filter(([x]) => terrain[x]![0] !== SEA);
    const seaFurtherIn = seaSquares.filter(([, z]) => z > 1);

    const isInShape = seaOnEdge.length >= FEWEST_SEA_SQUARES_ON_COASTAL_EDGE
      && seaOnEdge.length <= MOST_SEA_SQUARES_ON_COASTAL_EDGE
      && seaBehindEdge.length >= FEWEST_SEA_SQUARES_BEHIND_COASTAL_EDGE
      && seaBehindEdge.length <= MOST_SEA_SQUARES_BEHIND_COASTAL_EDGE
      && seaBehindLand.length === 0
      && seaFurtherIn.length === 0;
    return isInShape ? [] : [{ seaOnEdge, seaBehindEdge, seaBehindLand, seaFurtherIn }];
  });
}

// Every map drawn with coasts on its south edge, where z is highest, and its west edge, where x is
// 0, which has sea further in than the strip behind either edge, or too much or too little sea on
// either edge.
function mapsWithSeaAwayFromTheirSouthAndWestCoasts(): object[] {
  return mapsDrawn(SOUTH_AND_WEST_COAST_GROUND).flatMap(terrain => {
    const seaSquares = squaresOfSea(terrain);
    const seaAwayFromCoasts = seaSquares.filter(([x, z]) => x > 1 && z < SEKTOR_SIZE - 2);
    const seaOnEdges = [
      seaSquares.filter(([, z]) => z === SEKTOR_SIZE - 1).length,
      seaSquares.filter(([x]) => x === 0).length,
    ];
    const isInShape = seaAwayFromCoasts.length === 0 && seaOnEdges.every(seaOnEdge =>
      seaOnEdge >= FEWEST_SEA_SQUARES_ON_COASTAL_EDGE && seaOnEdge <= MOST_SEA_SQUARES_ON_COASTAL_EDGE);
    return isInShape ? [] : [{ seaAwayFromCoasts, seaOnEdges }];
  });
}

function mapsDrawn(ground: SektorGround): number[][][] {
  return Array.from({ length: MAPS_LOOKED_AT }, () => createTerrainMatrix(ground, Math.random));
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
