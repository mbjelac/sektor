import { describe, it, expect } from "vitest";
import { riverGlintStrips, riverSides } from "./river";
import { GROUND, RIVER_FROM_NORTH, RIVER_FROM_WEST, SEA } from "../../../shared/terrain";

const _ = GROUND;
const N = RIVER_FROM_NORTH;
const W = RIVER_FROM_WEST;
const S = SEA;

const NORTH = { x: 0, z: -1 };
const SOUTH = { x: 0, z: 1 };
const WEST = { x: -1, z: 0 };
const EAST = { x: 1, z: 0 };

describe("riverSides", () => {
  // The river runs along the middle row, turns down the middle column and runs into the sea.
  const terrain = [
    [_, _, _, _],
    [N, N, _, _],
    [_, W, _, _],
    [_, S, _, _],
  ];

  it("runs a straight section between river on two opposite sides", () => {
    expect(riverSides(terrain, 2, 1)).toEqual([WEST, EAST]);
  });

  it("runs a curve between river on a side facing north or south and one facing east or west", () => {
    expect(riverSides(terrain, 1, 1)).toEqual([NORTH, EAST]);
  });

  // The rim of the map counts as river running on past it.
  it("runs a square on the rim of the map on over the rim", () => {
    expect(riverSides(terrain, 1, 0)).toEqual([NORTH, SOUTH]);
  });

  it("counts the sea as river", () => {
    const terrainWithSea = [
      [_, _, _],
      [N, N, S],
      [_, _, _],
    ];

    expect(riverSides(terrainWithSea, 1, 1)).toEqual([NORTH, SOUTH]);
  });
});

describe("riverGlintStrips", () => {
  it("runs two strips of four glints straight across a straight section", () => {
    expect(riverGlintStrips([WEST, EAST], WEST).map(strip => strip.length)).toEqual([4, 4]);
  });

  // The river flows in from the west, so every strip starts at the west side of the square, the
  // middle of its first glint one and a half glints west of the middle of the square. Looking
  // east, the way the river flows, its left bank is the north one.
  it("starts every strip of a straight section at the side the river flows in from, left bank first", () => {
    expect(riverGlintStrips([WEST, EAST], WEST)).toEqual([
      [{ x: -1.5, z: -0.5 }, { x: -0.5, z: -0.5 }, { x: 0.5, z: -0.5 }, { x: 1.5, z: -0.5 }],
      [{ x: -1.5, z: 0.5 }, { x: -0.5, z: 0.5 }, { x: 0.5, z: 0.5 }, { x: 1.5, z: 0.5 }],
    ]);
  });

  // Looking west, the way the river flows, its left bank is the south one.
  it("starts every strip at the side the river flows in from whichever way the square is listed", () => {
    expect(riverGlintStrips([WEST, EAST], EAST)[0][0]).toEqual({ x: 1.5, z: 0.5 });
  });

  // Flowing south and turning east is turning left, so the inside of the curve is on the left bank.
  it("lists the strips of a curve turning left from its inside out", () => {
    expect(riverGlintStrips([NORTH, EAST], NORTH).map(strip => strip.length)).toEqual([3, 5]);
  });

  // Flowing west and turning north is turning right, so the outside of the curve is on the left bank.
  it("lists the strips of a curve turning right from its outside in", () => {
    expect(riverGlintStrips([NORTH, EAST], EAST).map(strip => strip.length)).toEqual([5, 3]);
  });

  // The river flows in from the north and out to the east, so the outside of the curve is the
  // south-west of the square: the outer strip comes down the west half of the river and turns along
  // the south half, and the inner one comes down the east half and turns along the north half.
  it("runs the strips of a curve round it, the outer one round the outside", () => {
    expect(riverGlintStrips([NORTH, EAST], NORTH)).toEqual([
      [{ x: 0.5, z: -1.5 }, { x: 0.5, z: -0.5 }, { x: 1.5, z: -0.5 }],
      [{ x: -0.5, z: -1.5 }, { x: -0.5, z: -0.5 }, { x: -0.5, z: 0.5 }, { x: 0.5, z: 0.5 }, { x: 1.5, z: 0.5 }],
    ]);
  });

  it("runs the strips of a curve the other way round when the river flows the other way", () => {
    expect(riverGlintStrips([NORTH, EAST], EAST)[1]).toEqual([
      { x: 1.5, z: -0.5 },
      { x: 0.5, z: -0.5 },
      { x: 0.5, z: -1.5 },
    ]);
  });
});
