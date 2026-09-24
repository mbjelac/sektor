import { describe, it, expect } from "vitest";
import { elevationRenderingCode, elevationVariation } from "./terrainFeatures";
import { SEKTOR_SIZE } from "../../../shared/sektorSize";

// How many shapes terrain.md describes rock standing in, which is how many the squares of a map
// are shared out between.
const ELEVATION_SHAPE_COUNT = 20;

function everySquareOfTheMap(): { x: number, z: number }[] {
  return Array.from({ length: SEKTOR_SIZE }, (_unused, x) =>
    Array.from({ length: SEKTOR_SIZE }, (_alsoUnused, z) => ({ x, z })))
    .flat();
}

describe("elevationVariation", () => {
  // Rock is drawn in whichever shape its square is counted down to, so every square of the map has
  // to name a shape there is.
  it("gives every square of the map one of the shapes rock stands in", () => {
    expect(everySquareOfTheMap().filter(square => {
      const variation = elevationVariation(square.x, square.z);
      return !Number.isInteger(variation) || variation < 0 || variation >= ELEVATION_SHAPE_COUNT;
    })).toEqual([]);
  });

  // Every shape is given the same share of the map, so no map is mostly one outcrop repeated and
  // none of the shapes goes unused.
  it("shares the map out evenly between the shapes", () => {
    const squaresPerShape = new Array<number>(ELEVATION_SHAPE_COUNT).fill(0);
    for (const square of everySquareOfTheMap()) squaresPerShape[elevationVariation(square.x, square.z)]++;

    expect([...new Set(squaresPerShape)]).toEqual([SEKTOR_SIZE * SEKTOR_SIZE / ELEVATION_SHAPE_COUNT]);
  });

  // A square keeps the shape it was given: were it drawn anew it would change under the player
  // every time the map was opened.
  it("gives a square the same shape every time it is asked", () => {
    expect(everySquareOfTheMap().filter(square =>
      elevationVariation(square.x, square.z) !== elevationVariation(square.x, square.z)
    )).toEqual([]);
  });
});

describe("elevationRenderingCode", () => {
  // Every shape rock may stand in has bodies to draw it with, so no square of rock comes out empty.
  it("has bodies to draw every shape rock stands in", () => {
    expect(Array.from({ length: ELEVATION_SHAPE_COUNT }, (_unused, variation) => variation)
      .filter(variation => elevationRenderingCode(variation).trim() === "")).toEqual([]);
  });

  // The shapes are told apart by nothing but the order they are written in, so no two of them may
  // be the same bodies.
  it("draws every shape differently from every other", () => {
    const renderingCodes = Array.from(
      { length: ELEVATION_SHAPE_COUNT },
      (_unused, variation) => elevationRenderingCode(variation),
    );

    expect(new Set(renderingCodes).size).toEqual(ELEVATION_SHAPE_COUNT);
  });
});
