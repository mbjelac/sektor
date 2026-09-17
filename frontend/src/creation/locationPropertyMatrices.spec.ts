import { describe, it, expect } from "vitest";
import { createLocationPropertyMatrix, DIMMEST_SUNLIGHT } from "./locationPropertyMatrices";
import { MODIFIER_MAX, MODIFIER_MIN } from "../../../shared/modifierLimits";
import { SEKTOR_SIZE } from "../../../shared/sektorSize";

const PATTERNED_PROPERTIES = ["metals", "minerals", "uranium", "wind", "groundwater", "soil"];
const ALL_PROPERTIES = [...PATTERNED_PROPERTIES, "insolation", "somethingNobodyDescribed"];

const RUNS = 50;

// Ground worth going out of the way for: it holds most of what a property is ever found holding.
function isRich(value: number): boolean {
  return value >= MODIFIER_MAX * 0.8;
}

function matrixOf(propertyName: string): number[][] {
  return createLocationPropertyMatrix(propertyName, Math.random);
}

function runsOf(propertyName: string): number[][][] {
  return Array.from({ length: RUNS }, () => matrixOf(propertyName));
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

  // The sun falls on the whole map alike, so no location starts the day in the dark: the ground
  // standing over a location is what takes its light away, and that is reckoned later.
  it("gives every location a good part of the day before anything stands over it", () => {
    const dimLocations = runsOf("insolation").flatMap(matrix => matrix.flat()).filter(value => value < DIMMEST_SUNLIGHT);

    expect(dimLocations).toEqual([]);
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
