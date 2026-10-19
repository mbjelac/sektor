import { describe, it, expect } from "vitest";
import { createLocationPropertyMatrix } from "./locationPropertyMatrices";
import { SektorGround } from "./terrainMatrix";
import { MODIFIER_MAX, MODIFIER_MIN } from "../../../shared/modifierLimits";
import { SEKTOR_SIZE } from "../../../shared/sektorSize";

const PATTERNED_PROPERTIES = ["metals", "minerals", "uranium", "wind", "groundwater", "soil"];
const ALL_PROPERTIES = [...PATTERNED_PROPERTIES, "insolation", "pollution", "somethingNobodyDescribed"];

const RUNS = 50;

const BIOMES = ["tropical", "temperate", "polar"];

const GRASSLAND = { biome: "temperate", isOnLand: true, isDesert: false, isForest: false };
const FOREST = { biome: "temperate", isOnLand: true, isDesert: false, isForest: true };

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

// Every value insolation takes anywhere on the maps of a ground of each biome, lowest first.
function insolationValuesByBiome(cover: Omit<SektorGround, "biome">): { [biome: string]: number[] } {
  return Object.fromEntries(BIOMES.map(biome => [
    biome,
    [...new Set(runsOf("insolation", { ...cover, biome }).flatMap(matrix => matrix.flat()))].sort((first, second) => first - second),
  ]));
}

// The brightest location of every map of a ground of each biome, as many different ones as there are.
function brightestInsolationByBiome(cover: Omit<SektorGround, "biome">): { [biome: string]: number[] } {
  return Object.fromEntries(BIOMES.map(biome => [
    biome,
    [...new Set(runsOf("insolation", { ...cover, biome }).map(matrix => Math.max(...matrix.flat())))],
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
  // property than the barren ground a player can build on anywhere.
  it("puts a rich hotspot on the map of every property which has a shape", () => {
    expect(PATTERNED_PROPERTIES.map(propertyName => ({
      property: propertyName,
      runsWithoutARichLocation: runsOf(propertyName).filter(matrix => !isRich(Math.max(...matrix.flat()))).length,
    }))).toEqual(PATTERNED_PROPERTIES.map(propertyName => ({ property: propertyName, runsWithoutARichLocation: 0 })));
  });

  // The desert and the sea lie open to the sun, so every location of the map sees the same of it.
  it("lights every location of a desert 12 in the tropics, 8 in temperate lands and 2 near the poles", () => {
    expect(insolationValuesByBiome({ isOnLand: true, isDesert: true, isForest: false }))
      .toEqual({ tropical: [12], temperate: [8], polar: [2] });
  });

  it("lights every location of the sea 10 in the tropics, 6 in temperate lands and 1 near the poles", () => {
    expect(insolationValuesByBiome({ isOnLand: false, isDesert: false, isForest: false }))
      .toEqual({ tropical: [10], temperate: [6], polar: [1] });
  });

  // Forest and grassland are lit in pockets, the middle of which is as bright as it gets there.
  it("lights the pockets of a forest at most 12 in the tropics, 8 in temperate lands and 1 near the poles", () => {
    expect(brightestInsolationByBiome({ isOnLand: true, isDesert: false, isForest: true }))
      .toEqual({ tropical: [12], temperate: [8], polar: [1] });
  });

  it("lights the pockets of grassland at most 12 in the tropics, 8 in temperate lands and 1 near the poles", () => {
    expect(brightestInsolationByBiome({ isOnLand: true, isDesert: false, isForest: false }))
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

  // Nothing has stood in a sektor just made to foul its ground, so none of it is polluted.
  it("leaves every location of a sektor just made unpolluted", () => {
    const pollutedLocations = runsOf("pollution").flatMap(matrix => matrix.flat()).filter(value => value !== 0);

    expect(pollutedLocations).toEqual([]);
  });

  // Wind does not settle anywhere: it comes in one edge of the map and leaves by the other, so
  // there is always a whole row or a whole column of it.
  it("blows wind clear across the map", () => {
    const isWindy = (value: number) => isRich(value);

    expect(runsOf("wind").filter(matrix =>
      !matrix.some(row => row.every(isWindy))
      && !matrix[0].some((_, z) => matrix.every(row => isWindy(row[z])))
    )).toEqual([]);
  });
});

// The temperate pockets are lit 8 at their middles, and no other location as brightly.
const TEMPERATE_POCKET_MIDDLE = 8;

function pocketCounts(ground: SektorGround): number[] {
  return runsOf("insolation", ground).map(matrix => locationsHolding(matrix, TEMPERATE_POCKET_MIDDLE).length);
}

function wronglyLitLocationsOf(ground: SektorGround, fallOffPerSquare: number): object[] {
  return runsOf("insolation", ground).flatMap(matrix => {
    const pocketMiddles = locationsHolding(matrix, TEMPERATE_POCKET_MIDDLE);
    return matrix.flatMap((row, x) => row.flatMap((value, z) => {
      const distance = Math.min(...pocketMiddles.map(middle => Math.hypot(middle.x - x, middle.z - z)));
      const expected = Math.max(0, Math.round(TEMPERATE_POCKET_MIDDLE - fallOffPerSquare * distance));
      return value === expected ? [] : [{ isForest: ground.isForest, x, z, value, expected }];
    }));
  });
}
