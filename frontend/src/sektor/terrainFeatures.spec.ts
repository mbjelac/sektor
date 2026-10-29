import { describe, it, expect } from "vitest";
import {
  elevationRenderingCode,
  ElevationSide,
  ElevationSides,
  elevationSideFiles,
  elevationSides,
  squareVariation,
} from "./terrainFeatures";
import { SEKTOR_SIZE } from "../../../shared/sektorSize";
import { ELEVATION, GROUND, SEA } from "../../../shared/terrain";
import { TerrainStyle } from "./terrainStyle";
import { ElevationCover } from "./elevationCover";

// How many shapes rock and forests stand in, which is how many the squares of a map are shared out between.
const SQUARE_VARIATION_COUNT = 10;

const TERRAIN_STYLES: TerrainStyle[] = ["temperate", "tropical", "polar", "desert"];

const ELEVATION_COVERS: ElevationCover[] = ["forested", "grasslands"];

function everySquareOfTheMap(): { x: number, z: number }[] {
  return Array.from({ length: SEKTOR_SIZE }, (_unused, x) =>
    Array.from({ length: SEKTOR_SIZE }, (_alsoUnused, z) => ({ x, z })))
    .flat();
}

describe("squareVariation", () => {
  // Rock and forests are drawn in whichever shape their square is counted down to, so every square
  // of the map has to name a shape there is.
  it("gives every square of the map one of the shapes rock and forests stand in", () => {
    expect(everySquareOfTheMap().filter(square => {
      const variation = squareVariation(square.x, square.z);
      return !Number.isInteger(variation) || variation < 0 || variation >= SQUARE_VARIATION_COUNT;
    })).toEqual([]);
  });

  // Every shape is given the same share of the map, so no map is mostly one outcrop repeated and
  // none of the shapes goes unused.
  it("shares the map out evenly between the shapes", () => {
    const squaresPerShape = new Array<number>(SQUARE_VARIATION_COUNT).fill(0);
    for (const square of everySquareOfTheMap()) squaresPerShape[squareVariation(square.x, square.z)]++;

    expect([...new Set(squaresPerShape)]).toEqual([SEKTOR_SIZE * SEKTOR_SIZE / SQUARE_VARIATION_COUNT]);
  });

  // Two squares side by side in the same shape would read as one outcrop or forest stamped twice.
  it("never gives two squares side by side the same shape", () => {
    expect(everySquareOfTheMap().filter(square =>
      [{ x: square.x + 1, z: square.z }, { x: square.x, z: square.z + 1 }]
        .some(neighbour => neighbour.x < SEKTOR_SIZE && neighbour.z < SEKTOR_SIZE
          && squareVariation(neighbour.x, neighbour.z) === squareVariation(square.x, square.z)))).toEqual([]);
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
  // Every side of every shape has bodies to draw it with, in every look of the terrain, so no side
  // of any rock comes out empty.
  it("has bodies to draw every side of every shape in every look and cover", () => {
    const shapesWithAnEmptySide = TERRAIN_STYLES
      .flatMap(terrainStyle => ELEVATION_COVERS.map(elevationCover => ({ terrainStyle, elevationCover })))
      .flatMap(look => Array.from({ length: SQUARE_VARIATION_COUNT }, (_unused, variation) => ({ ...look, variation })))
      .flatMap(shape => (["edge", "middle"] as const).map(side => ({ ...shape, side })))
      .filter(({ terrainStyle, elevationCover, variation, side }) =>
        elevationRenderingCode(variation, everySideDrawnAs(side), terrainStyle, elevationCover)
          .split("\n").some(line => line.trim() === ""));

    expect(shapesWithAnEmptySide).toEqual([]);
  });

  // Forested rock and grassland rock are drawn from folders of their own in every look but the
  // desert's, which has nothing to be wooded with and draws both the same.
  it("draws forested and grassland rock differently in every look but the desert", () => {
    const looksDrawingCoversAlike = TERRAIN_STYLES.map(terrainStyle => ({
      terrainStyle,
      coversDrawnAlike: elevationRenderingCode(0, everySideDrawnAs("edge"), terrainStyle, "forested")
        === elevationRenderingCode(0, everySideDrawnAs("edge"), terrainStyle, "grasslands"),
    }));

    expect(looksDrawingCoversAlike).toEqual([
      { terrainStyle: "temperate", coversDrawnAlike: false },
      { terrainStyle: "tropical", coversDrawnAlike: false },
      { terrainStyle: "polar", coversDrawnAlike: false },
      { terrainStyle: "desert", coversDrawnAlike: true },
    ]);
  });
});

function everySideDrawnAs(side: ElevationSide): ElevationSides {
  return { north: side, east: side, south: side, west: side };
}
