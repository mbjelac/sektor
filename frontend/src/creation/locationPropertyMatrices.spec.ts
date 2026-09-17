import { describe, it, expect } from "vitest";
import { createLocationPropertyMatrix, STRONGEST_WIND_ON_FLAT_GROUND } from "./locationPropertyMatrices";
import { MODIFIER_MAX, MODIFIER_MIN } from "../../../shared/modifierLimits";
import { SEKTOR_SIZE } from "../../../shared/sektorSize";

const PATTERNED_PROPERTIES = ["metals", "minerals", "uranium", "wind", "groundwater", "soil"];
const ALL_PROPERTIES = [...PATTERNED_PROPERTIES, "insolation", "somethingNobodyDescribed"];

const RUNS = 50;

// The most of a property the ground alone ever holds. Wind is the one property flat ground is never
// full of, because what makes a place windy is standing high.
function mostOnFlatGround(propertyName: string): number {
  return propertyName === "wind" ? STRONGEST_WIND_ON_FLAT_GROUND : MODIFIER_MAX;
}

// Ground worth going out of the way for: it holds most of what its property is ever found holding.
function isRich(propertyName: string, value: number): boolean {
  return value >= mostOnFlatGround(propertyName) * 0.8;
}

function matrixOf(propertyName: string, minimumValue = MODIFIER_MIN): number[][] {
  return createLocationPropertyMatrix(propertyName, minimumValue, Math.random);
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
    })).toEqual(ALL_PROPERTIES.map(propertyName => ({ property: propertyName, rows: SEKTOR_SIZE, rowLengths: [SEKTOR_SIZE] })));
  });

  // A sektor solved with a property needs something of it everywhere, and nothing anywhere holds
  // more of a property than a property can hold.
  it("never leaves a location poorer than the least asked of it, nor richer than the most there is", () => {
    const leastAsked = 7;

    expect(ALL_PROPERTIES.map(propertyName => ({
      property: propertyName,
      valuesOutOfRange: runsOf(propertyName, leastAsked)
        .flatMap(matrix => matrix.flat())
        // A property the flat ground never holds much of cannot be asked for more than its own
        // most, so what is asked of it is whichever of the two is smaller.
        .filter(value => value < Math.min(leastAsked, mostOnFlatGround(propertyName)) || value > mostOnFlatGround(propertyName)),
    }))).toEqual(ALL_PROPERTIES.map(propertyName => ({ property: propertyName, valuesOutOfRange: [] })));
  });

  // A pattern is a pattern because somewhere is worth going to: ground which holds far more of the
  // property than the barren ground a player can build on anywhere.
  it("puts a rich hotspot on the map of every property which has a shape", () => {
    expect(PATTERNED_PROPERTIES.map(propertyName => ({
      property: propertyName,
      runsWithoutARichLocation: runsOf(propertyName).filter(matrix => !isRich(propertyName, Math.max(...matrix.flat()))).length,
    }))).toEqual(PATTERNED_PROPERTIES.map(propertyName => ({ property: propertyName, runsWithoutARichLocation: 0 })));
  });

  // Wind does not settle anywhere: it comes in one edge of the map and leaves by the other, so
  // there is always a whole row or a whole column of it.
  it("blows wind clear across the map", () => {
    const isWindy = (value: number) => isRich("wind", value);

    expect(runsOf("wind").filter(matrix =>
      !matrix.some(row => row.every(isWindy))
      && !matrix[0].some((_, z) => matrix.every(row => isWindy(row[z])))
    )).toEqual([]);
  });
});
