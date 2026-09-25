import { describe, it, expect } from "vitest";
import { elevationRenderingCode, elevationSideFiles, elevationSides, elevationVariation } from "./terrainFeatures";
import { SEKTOR_SIZE } from "../../../shared/sektorSize";
import { ELEVATION, GROUND, SEA } from "../../../shared/terrain";

// How many shapes the rock stands in, which is how many the squares of a map are shared out between.
const ELEVATION_VARIATION_COUNT = 10;

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
      return !Number.isInteger(variation) || variation < 0 || variation >= ELEVATION_VARIATION_COUNT;
    })).toEqual([]);
  });

  // Every shape is given the same share of the map, so no map is mostly one outcrop repeated and
  // none of the shapes goes unused.
  it("shares the map out evenly between the shapes", () => {
    const squaresPerShape = new Array<number>(ELEVATION_VARIATION_COUNT).fill(0);
    for (const square of everySquareOfTheMap()) squaresPerShape[elevationVariation(square.x, square.z)]++;

    expect([...new Set(squaresPerShape)]).toEqual([SEKTOR_SIZE * SEKTOR_SIZE / ELEVATION_VARIATION_COUNT]);
  });
});

describe("elevationSides", () => {
  // The terrain is read column first: terrain[x][y], x running west to east and y north to south.
  it("runs a side into the middle of the rock where the square on that side is rock too", () => {
    const terrain = [
      [GROUND, ELEVATION, GROUND],
      [SEA, ELEVATION, ELEVATION],
      [GROUND, GROUND, GROUND],
    ];

    expect(elevationSides(terrain, 1, 1)).toEqual({ north: "edge", east: "edge", south: "middle", west: "middle" });
  });

  // Past the rim of the map there is nothing, so a square of rock on the rim is drawn with an edge
  // looking out of the map.
  it("draws an edge on every side looking out of the map", () => {
    const terrain = [[ELEVATION]];

    expect(elevationSides(terrain, 0, 0)).toEqual({ north: "edge", east: "edge", south: "edge", west: "edge" });
  });
});

describe("elevationSideFiles", () => {
  it("takes every side from its own file, in the shape of the square", () => {
    expect(elevationSideFiles(7, { north: "middle", east: "edge", south: "edge", west: "middle" }))
      .toEqual(["middle/n7.sgl", "edge/e7.sgl", "edge/s7.sgl", "middle/w7.sgl"]);
  });
});

describe("elevationRenderingCode", () => {
  // Every side of every shape has bodies to draw it with, so no side of any rock comes out empty.
  it("has bodies to draw every side of every shape", () => {
    const everySideDrawnAs = (side: "edge" | "middle") => ({ north: side, east: side, south: side, west: side });
    const shapesWithAnEmptySide = Array.from({ length: ELEVATION_VARIATION_COUNT }, (_unused, variation) => variation)
      .flatMap(variation => (["edge", "middle"] as const).map(side => ({ variation, side })))
      .filter(({ variation, side }) =>
        elevationRenderingCode(variation, everySideDrawnAs(side)).split("\n").some(line => line.trim() === ""));

    expect(shapesWithAnEmptySide).toEqual([]);
  });
});
