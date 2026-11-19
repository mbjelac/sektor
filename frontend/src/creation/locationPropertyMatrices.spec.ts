import { describe, it, expect } from "vitest";
import { createLocationPropertyMatrix, ORE_RICH_MAX, WIND_FALL_OFF_PER_ROW } from "./locationPropertyMatrices";
import { SektorGround } from "./terrainMatrix";
import { MODIFIER_MAX, MODIFIER_MIN } from "../../../shared/modifierLimits";
import { SEKTOR_SIZE } from "../../../shared/sektorSize";

const ORES = ["metals", "minerals", "uranium"];
const PATTERNED_PROPERTIES = [...ORES, "groundwater", "soil"];
const ALL_PROPERTIES = [...PATTERNED_PROPERTIES, "insolation", "wind", "pollution", "somethingNobodyDescribed"];

const RUNS = 50;

const BIOMES = ["tropical", "temperate", "polar"];

const GRASSLAND = { biome: "temperate", isOnLand: true, isDesert: false, isForest: false, coastalEdges: [], richOre: null };
const FOREST = { biome: "temperate", isOnLand: true, isDesert: false, isForest: true, coastalEdges: [], richOre: null };

// Ground worth going out of the way for: it holds most of what a property is ever found holding.
function isRich(value: number): boolean {
  return value >= MODIFIER_MAX * 0.8;
}

function matrixOf(propertyName: string, ground: SektorGround = GRASSLAND): number[][] {
  return createLocationPropertyMatrix(propertyName, ground, Math.random);
}

function runsOf(propertyName: string, ground: SektorGround = GRASSLAND): number[][][] {
  return Array.from({ length: RUNS }, () => matrixOf(propertyName, ground));
}

// Every value a property takes anywhere on the maps of a ground of each biome, lowest first.
function valuesByBiome(propertyName: string, cover: Omit<SektorGround, "biome">): { [biome: string]: number[] } {
  return Object.fromEntries(BIOMES.map(biome => [
    biome,
    [...new Set(runsOf(propertyName, { ...cover, biome }).flatMap(matrix => matrix.flat()))].sort((first, second) => first - second),
  ]));
}

// The highest value a property takes on every map of a ground of each biome, as many different ones as there are.
function highestByBiome(propertyName: string, cover: Omit<SektorGround, "biome">): { [biome: string]: number[] } {
  return Object.fromEntries(BIOMES.map(biome => [
    biome,
    [...new Set(runsOf(propertyName, { ...cover, biome }).map(matrix => Math.max(...matrix.flat())))],
  ]));
}

function locationsHolding(matrix: number[][], value: number): { x: number, z: number }[] {
  return matrix.flatMap((row, x) => row.flatMap((locationValue, z) => locationValue === value ? [{ x, z }] : []));
}

describe("createLocationPropertyMatrix", () => {
  // Every location of the sektor holds a value of the property, and no value describes ground the
  // sektor does not have.
  it("covers the sektor's map and no more of it", () => {
    expect(ALL_PROPERTIES.map(propertyName => {
      const matrix = matrixOf(propertyName);
      return { property: propertyName, rows: matrix.length, rowLengths: [...new Set(matrix.map(row => row.length))] };
    })).toEqual(ALL_PROPERTIES.map(propertyName => ({ property: propertyName, rows: SEKTOR_SIZE, rowLengths: [SEKTOR_SIZE] })));
  });

  // Nothing anywhere holds less of a property than the poorest ground there is or more than the
  // richest.
  it("never leaves a location poorer or richer than a property can be", () => {
    expect(ALL_PROPERTIES.map(propertyName => ({
      property: propertyName,
      valuesOutOfRange: runsOf(propertyName)
        .flatMap(matrix => matrix.flat())
        .filter(value => value < MODIFIER_MIN || value > MODIFIER_MAX),
    }))).toEqual(ALL_PROPERTIES.map(propertyName => ({ property: propertyName, valuesOutOfRange: [] })));
  });

  // A pattern is a pattern because somewhere is worth going to: ground which holds far more of the
  // property than the barren ground a player can build on anywhere. An ore is rich only where the
  // area is rich in it.
  it("puts a rich hotspot on the map of every property which has a shape", () => {
    expect(PATTERNED_PROPERTIES.map(propertyName => ({
      property: propertyName,
      runsWithoutARichLocation: runsOf(propertyName, { ...GRASSLAND, richOre: propertyName })
        .filter(matrix => !isRich(Math.max(...matrix.flat()))).length,
    }))).toEqual(PATTERNED_PROPERTIES.map(propertyName => ({ property: propertyName, runsWithoutARichLocation: 0 })));
  });

  // Where the area is rich in an ore, the ore's hotspots hold as much of it as there ever is.
  it("holds up to 12 of the ore the area is rich in", () => {
    expect(ORES.map(oreName => ({
      ore: oreName,
      highest: Math.max(...runsOf(oreName, { ...GRASSLAND, richOre: oreName }).flatMap(matrix => matrix.flat())),
    }))).toEqual(ORES.map(oreName => ({ ore: oreName, highest: ORE_RICH_MAX })));
  });

  // Where the area is rich in another ore or none, the sektor has only a few hotspots of the ore,
  // some holding 1 and some 2, or none at all.
  it("holds no more than 2 of an ore the area is not rich in", () => {
    const highestValues = (ground: SektorGround, oreName: string) =>
      [...new Set(runsOf(oreName, ground).map(matrix => Math.max(...matrix.flat())))].sort((first, second) => first - second);
    expect(ORES.map(oreName => ({
      ore: oreName,
      highestWhereRichInNone: highestValues(GRASSLAND, oreName),
      highestWhereRichInAnother: highestValues({ ...GRASSLAND, richOre: ORES.find(other => other !== oreName)! }, oreName),
    }))).toEqual(ORES.map(oreName => ({ ore: oreName, highestWhereRichInNone: [0, 1, 2], highestWhereRichInAnother: [0, 1, 2] })));
  });

  // The draws fall: how many hotspots, where each of them is among the tiles still free, then what
  // each holds. A hotspot in the middle of the map is the 46th of its 100 tiles.
  it("lets an ore the area is not rich in fall away by 1 a square from a hotspot holding 2", () => {
    expect(orePoorLocations(0.3, 0.455, 0.9))
      .toEqual({ "4:5": 2, "3:5": 1, "5:5": 1, "4:4": 1, "4:6": 1 });
  });

  it("holds nothing around a hotspot holding 1 of an ore the area is not rich in", () => {
    expect(orePoorLocations(0.3, 0.455, 0.1)).toEqual({ "4:5": 1 });
  });

  it("holds none of an ore the area is not rich in when it has no hotspots", () => {
    expect(orePoorLocations(0.1)).toEqual({});
  });

  // Four hotspots: two corners holding 2, the tile beside one corner and the middle holding 1. The
  // tile beside the corner holds 1 by either of them.
  it("puts up to 4 hotspots of an ore the area is not rich in", () => {
    expect(orePoorLocations(0.99, 0, 0, 0.999, 53.5 / 97, 0.9, 0.1, 0.9, 0.1))
      .toEqual({ "0:0": 2, "0:1": 1, "1:0": 1, "9:9": 2, "8:9": 1, "9:8": 1, "5:5": 1 });
  });

  // The desert and the sea lie open to the sun, so every location of the map sees the same of it.
  it("lights every location of a desert 12 in the tropics, 8 in temperate lands and 2 near the poles", () => {
    expect(valuesByBiome("insolation", { isOnLand: true, isDesert: true, isForest: false, coastalEdges: [], richOre: null }))
      .toEqual({ tropical: [12], temperate: [8], polar: [2] });
  });

  it("lights every location of the sea 10 in the tropics, 6 in temperate lands and 1 near the poles", () => {
    expect(valuesByBiome("insolation", { isOnLand: false, isDesert: false, isForest: false, coastalEdges: [], richOre: null }))
      .toEqual({ tropical: [10], temperate: [6], polar: [1] });
  });

  // Forest and grassland are lit in pockets, the middle of which is as bright as it gets there.
  it("lights the pockets of a forest at most 12 in the tropics, 8 in temperate lands and 1 near the poles", () => {
    expect(highestByBiome("insolation", { isOnLand: true, isDesert: false, isForest: true, coastalEdges: [], richOre: null }))
      .toEqual({ tropical: [12], temperate: [8], polar: [1] });
  });

  it("lights the pockets of grassland at most 12 in the tropics, 8 in temperate lands and 1 near the poles", () => {
    expect(highestByBiome("insolation", { isOnLand: true, isDesert: false, isForest: false, coastalEdges: [], richOre: null }))
      .toEqual({ tropical: [12], temperate: [8], polar: [1] });
  });

  // Every pocket has a middle of its own, the only location lit as brightly as the ground there is
  // lit at all.
  it("lights six to ten pockets on every map of forest and four to eight on every map of grassland", () => {
    const pocketCountsOutOfRange = [
      ...pocketCounts(FOREST).filter(pocketCount => pocketCount < 6 || pocketCount > 10).map(pocketCount => ({ forest: pocketCount })),
      ...pocketCounts(GRASSLAND).filter(pocketCount => pocketCount < 4 || pocketCount > 8).map(pocketCount => ({ grassland: pocketCount })),
    ];

    expect(pocketCountsOutOfRange).toEqual([]);
  });

  // The light falls away square by square from the middle of the nearest pocket: by 4 a square in a
  // forest, by 2 in grassland, and never below dark.
  it("darkens forest by 4 and grassland by 2 for every square away from the nearest pocket", () => {
    const wronglyLitLocations = [
      ...wronglyLitLocationsOf(FOREST, 4),
      ...wronglyLitLocationsOf(GRASSLAND, 2),
    ];

    expect(wronglyLitLocations).toEqual([]);
  });

  // Groundwater gathers in pockets, full at their middles and drying up by 4 for every square away.
  it("dries groundwater up by 4 for every square away from the nearest pocket", () => {
    const wronglyWateredLocations = runsOf("groundwater")
      .flatMap(matrix => locationsNotFallingOffFromPockets(matrix, MODIFIER_MAX, 4));

    expect(wronglyWateredLocations).toEqual([]);
  });

  // Wet lands and forests have more pockets of groundwater than dry lands and grassland, the sea a
  // few and the desert mostly none.
  it("gathers as many pockets of groundwater as the biome has", () => {
    expect({
      sea: groundwaterPocketCountsByBiome({ isOnLand: false, isDesert: false, isForest: false, coastalEdges: [], richOre: null }),
      forest: groundwaterPocketCountsByBiome({ isOnLand: true, isDesert: false, isForest: true, coastalEdges: [], richOre: null }),
      grassland: groundwaterPocketCountsByBiome({ isOnLand: true, isDesert: false, isForest: false, coastalEdges: [], richOre: null }),
      desert: groundwaterPocketCountsByBiome({ isOnLand: true, isDesert: true, isForest: false, coastalEdges: [], richOre: null }),
    }).toEqual({
      sea: { tropical: [1, 2, 3], temperate: [1, 2, 3], polar: [1, 2, 3] },
      forest: { tropical: [8, 9, 10, 11, 12, 13, 14, 15], temperate: [5, 6, 7, 8, 9, 10], polar: [3, 4, 5, 6, 7, 8] },
      grassland: { tropical: [6, 7, 8, 9, 10, 11, 12], temperate: [4, 5, 6, 7, 8], polar: [0, 1, 2, 3, 4, 5] },
      desert: { tropical: [0, 1, 2], temperate: [0, 1, 2], polar: [0, 1, 2] },
    });
  });

  // The desert has no pocket half the time, one 30% of the time and two 20% of the time.
  it("gathers no groundwater in half of the deserts, one pocket in 30% and two in 20%", () => {
    const pocketCounts = Array.from({ length: 1000 }, (_, run) =>
      pocketCountOf(createLocationPropertyMatrix("groundwater", { biome: "temperate", isOnLand: true, isDesert: true, isForest: false, coastalEdges: [], richOre: null }, drawingFirst((run + 0.5) / 1000))));

    expect([0, 1, 2].map(pocketCount => pocketCounts.filter(count => count === pocketCount).length)).toEqual([500, 300, 200]);
  });

  // The cold leaves soil thin: no soil anywhere is richer than 12 in the tropics and temperate
  // lands, or than 4 near the poles.
  it("never makes soil richer than 12 in the tropics and temperate lands, or than 4 near the poles", () => {
    const richestSoilByBiome = { tropical: 12, temperate: 12, polar: 4 };
    const tooRichSoil = BIOMES.flatMap(biome =>
      runsOf("soil", { ...GRASSLAND, biome })
        .flatMap(matrix => matrix.flat())
        .filter(value => value > richestSoilByBiome[biome as keyof typeof richestSoilByBiome])
        .map(value => ({ biome, value })));

    expect(tooRichSoil).toEqual([]);
  });

  it("makes no soil at all in the desert", () => {
    expect(valuesByBiome("soil", { isOnLand: true, isDesert: true, isForest: false, coastalEdges: [], richOre: null }))
      .toEqual({ tropical: [0], temperate: [0], polar: [0] });
  });

  // Nothing has stood in a sektor just made to foul its ground, so none of it is polluted.
  it("leaves every location of a sektor just made unpolluted", () => {
    const pollutedLocations = runsOf("pollution").flatMap(matrix => matrix.flat()).filter(value => value !== 0);

    expect(pollutedLocations).toEqual([]);
  });

  // Nothing stands in the way of the wind over the desert and the sea; trees break it, forest more
  // than grassland.
  it("blows the wind of its tracks 12 over the desert and the sea, 8/6/8 over forest and 10/8/10 over grassland", () => {
    expect({
      desert: highestByBiome("wind", { isOnLand: true, isDesert: true, isForest: false, coastalEdges: [], richOre: null }),
      sea: highestByBiome("wind", { isOnLand: false, isDesert: false, isForest: false, coastalEdges: [], richOre: null }),
      forest: highestByBiome("wind", { isOnLand: true, isDesert: false, isForest: true, coastalEdges: [], richOre: null }),
      grassland: highestByBiome("wind", { isOnLand: true, isDesert: false, isForest: false, coastalEdges: [], richOre: null }),
    }).toEqual({
      desert: { tropical: [12], temperate: [12], polar: [12] },
      sea: { tropical: [12], temperate: [12], polar: [12] },
      forest: { tropical: [8], temperate: [6], polar: [8] },
      grassland: { tropical: [10], temperate: [8], polar: [10] },
    });
  });

  // Wind does not settle anywhere: it runs in one to three tracks, each a whole row or a whole
  // column of the map blowing as hard as the wind blows there, and all of them running the same way.
  it("runs one to three parallel tracks of wind clear across the map", () => {
    const mapsWithWrongTracks = runsOf("wind").flatMap(matrix => {
      const { alongX, alongZ } = windTracks(matrix);
      const tracksOneWay = (alongX.length === 0) !== (alongZ.length === 0);
      const trackCount = alongX.length + alongZ.length;
      return tracksOneWay && trackCount >= 1 && trackCount <= 3 ? [] : [{ alongX, alongZ }];
    });

    expect(mapsWithWrongTracks).toEqual([]);
  });

  // The rows beside a track blow less the further they lie from the nearest track.
  it("blows the wind 3 less for every row away from the nearest track", () => {
    const wronglyWindyLocations = runsOf("wind").flatMap(matrix => {
      const { alongX, alongZ } = windTracks(matrix);
      return matrix.flatMap((row, x) => row.flatMap((value, z) => {
        const rowsFromTrack = Math.min(...alongX.map(track => Math.abs(track - z)), ...alongZ.map(track => Math.abs(track - x)));
        const expected = Math.max(0, GRASSLAND_WIND - WIND_FALL_OFF_PER_ROW * rowsFromTrack);
        return value === expected ? [] : [{ x, z, value, expected }];
      }));
    });

    expect(wronglyWindyLocations).toEqual([]);
  });
});

// The temperate pockets are lit 8 at their middles, and no other location as brightly.
const TEMPERATE_POCKET_MIDDLE = 8;

function pocketCounts(ground: SektorGround): number[] {
  return runsOf("insolation", ground).map(matrix => locationsHolding(matrix, TEMPERATE_POCKET_MIDDLE).length);
}

function wronglyLitLocationsOf(ground: SektorGround, fallOffPerSquare: number): object[] {
  return runsOf("insolation", ground).flatMap(matrix =>
    locationsNotFallingOffFromPockets(matrix, TEMPERATE_POCKET_MIDDLE, fallOffPerSquare)
      .map(location => ({ isForest: ground.isForest, ...location })));
}

// Every location which does not hold the most there is, less the fall-off for every square between
// it and the nearest pocket middle — a location holding the most there is.
function locationsNotFallingOffFromPockets(matrix: number[][], highest: number, fallOffPerSquare: number): object[] {
  const pocketMiddles = locationsHolding(matrix, highest);
  return matrix.flatMap((row, x) => row.flatMap((value, z) => {
    const distance = Math.min(...pocketMiddles.map(middle => Math.hypot(middle.x - x, middle.z - z)));
    const expected = Math.max(0, Math.round(highest - fallOffPerSquare * distance));
    return value === expected ? [] : [{ x, z, value, expected }];
  }));
}

// The wind of a temperate grassland's tracks, which blows nowhere else on its map.
const GRASSLAND_WIND = 8;

// The rows (along x, by their z) and columns (along z, by their x) blowing as hard as a track all the way across.
function windTracks(matrix: number[][]): { alongX: number[], alongZ: number[] } {
  return {
    alongX: matrix[0].flatMap((_, z) => matrix.every(row => row[z] === GRASSLAND_WIND) ? [z] : []),
    alongZ: matrix.flatMap((row, x) => row.every(value => value === GRASSLAND_WIND) ? [x] : []),
  };
}

// Every pocket of groundwater has a middle of its own, the only location as full as ground ever is.
function pocketCountOf(matrix: number[][]): number {
  return locationsHolding(matrix, MODIFIER_MAX).length;
}

// Every count of groundwater pockets turning up on the maps of a ground of each biome, fewest first.
function groundwaterPocketCountsByBiome(cover: Omit<SektorGround, "biome">): { [biome: string]: number[] } {
  return Object.fromEntries(BIOMES.map(biome => [
    biome,
    [...new Set(Array.from({ length: 400 }, () => pocketCountOf(matrixOf("groundwater", { ...cover, biome }))))]
      .sort((first, second) => first - second),
  ]));
}

// The first draw is the one given, every draw after it falls at random.
// The locations of an ore-poor metals map which hold any of it, by "x:z", from the draws given.
function orePoorLocations(...draws: number[]): { [location: string]: number } {
  const matrix = createLocationPropertyMatrix("metals", GRASSLAND, () => draws.shift()!);
  return Object.fromEntries(matrix.flatMap((row, x) => row.flatMap((value, z) => value > 0 ? [[`${x}:${z}`, value]] : [])));
}

function drawingFirst(firstDraw: number): () => number {
  let isFirstDraw = true;
  return () => {
    if (!isFirstDraw) return Math.random();
    isFirstDraw = false;
    return firstDraw;
  };
}
