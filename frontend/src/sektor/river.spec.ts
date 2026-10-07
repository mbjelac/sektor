import { describe, it, expect } from "vitest";
import { riverSides } from "./river";
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
