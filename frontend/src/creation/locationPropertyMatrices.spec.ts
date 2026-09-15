import { describe, it, expect } from "vitest";
import { createLocationPropertyMatrix } from "./locationPropertyMatrices";
import { MODIFIER_MAX, MODIFIER_MIN } from "../../../shared/modifierLimits";

const PATTERNED_PROPERTIES = ["metals", "minerals", "uranium", "wind", "groundwater", "soil"];
const ALL_PROPERTIES = [...PATTERNED_PROPERTIES, "insolation", "somethingNobodyDescribed"];

const MAP_SIZE = 10;
const RUNS = 50;

function matrixOf(propertyName: string, minimumValue = MODIFIER_MIN): number[][] {
  return createLocationPropertyMatrix(propertyName, MAP_SIZE, minimumValue, Math.random);
}

function runsOf(propertyName: string, minimumValue = MODIFIER_MIN): number[][][] {
  return Array.from({ length: RUNS }, () => matrixOf(propertyName, minimumValue));
}

describe("createLocationPropertyMatrix", () => {
  // Every location of the sektor holds a value of the property, and no value describes ground the
  // sektor does not have.
  it("covers the sektor's map and no more of it", () => {
    expect(ALL_PROPERTIES.map(propertyName => {
      const matrix = matrixOf(propertyName);
      return { property: propertyName, rows: matrix.length, rowLengths: [...new Set(matrix.map(row => row.length))] };
    })).toEqual(ALL_PROPERTIES.map(propertyName => ({ property: propertyName, rows: MAP_SIZE, rowLengths: [MAP_SIZE] })));
  });

  // A sektor solved with a property needs something of it everywhere, and nothing anywhere holds
  // more of a property than a property can hold.
  it("never leaves a location poorer than the least asked of it, nor richer than the most there is", () => {
    const leastAsked = 7;

    expect(ALL_PROPERTIES.map(propertyName => ({
      property: propertyName,
      valuesOutOfRange: runsOf(propertyName, leastAsked)
        .flatMap(matrix => matrix.flat())
        .filter(value => value < leastAsked || value > MODIFIER_MAX),
    }))).toEqual(ALL_PROPERTIES.map(propertyName => ({ property: propertyName, valuesOutOfRange: [] })));
  });

  // A pattern is a pattern because somewhere is worth going to: ground which holds far more of the
  // property than the barren ground a player can build on anywhere.
  it("puts a rich hotspot on the map of every property which has a shape", () => {
    expect(PATTERNED_PROPERTIES.map(propertyName => ({
      property: propertyName,
      runsWithoutARichLocation: runsOf(propertyName).filter(matrix => Math.max(...matrix.flat()) < 10).length,
    }))).toEqual(PATTERNED_PROPERTIES.map(propertyName => ({ property: propertyName, runsWithoutARichLocation: 0 })));
  });

  // Wind does not settle anywhere: it comes in one edge of the map and leaves by the other, so
  // there is always a whole row or a whole column of it.
  it("blows wind clear across the map", () => {
    const isRich = (value: number) => value >= 10;

    expect(runsOf("wind").filter(matrix =>
      !matrix.some(row => row.every(isRich))
      && !matrix[0].some((_, z) => matrix.every(row => isRich(row[z])))
    )).toEqual([]);
  });
});
