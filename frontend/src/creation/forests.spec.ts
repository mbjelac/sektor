import { describe, it, expect } from "vitest";
import { drawForestShare, plantForests } from "./forests";
import { ELEVATION, GROUND, SEA } from "../../../shared/terrain";

// The draws fall in the order given, the last of them over and over once the others are used up.
function drawing(...values: number[]): () => number {
  let drawIndex = 0;
  return () => values[Math.min(drawIndex++, values.length - 1)];
}

function allGround(width: number, height: number): number[][] {
  return Array.from({ length: width }, () => Array.from({ length: height }, () => GROUND));
}

function forestSquares(terrain: number[][], forestShare: number, randomNumber: () => number) {
  return plantForests(terrain, forestShare, randomNumber).map(building => building.location);
}

// The terrain is read column first: terrain[x][y]. Each forest takes one draw for the square it
// starts on, one for its size — below a third one square, below two thirds two, else three — and
// one for every square it spreads onto.
describe("plantForests", () => {
  it("plants no forest when forests are to cover none of the ground", () => {
    expect(plantForests(allGround(5, 5), 0, Math.random)).toEqual([]);
  });

  it("covers as much of the plain ground with forest as forests are to cover", () => {
    expect(forestSquares(allGround(4, 5), 0.6, Math.random).length).toEqual(12);
  });

  // Covering all of the ground, forest stands on every square of plain ground and on nothing else.
  // Every draw picks the first square still free and a forest of one square.
  it("plants forests only on plain ground", () => {
    const terrain = [
      [GROUND, SEA],
      [ELEVATION, GROUND],
    ];

    expect(plantForests(terrain, 1, drawing(0))).toEqual([
      { type: "Forest", location: { x: 0, y: 0 } },
      { type: "Forest", location: { x: 1, y: 1 } },
    ]);
  });

  // The forest starts on the first square, is drawn three squares big, and spreads along the only
  // ground there is.
  it("spreads a forest bigger than one square onto the ground around where it starts", () => {
    expect(forestSquares([[GROUND, GROUND, GROUND, GROUND]], 0.75, drawing(0, 0.9, 0, 0))).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
    ]);
  });

  // Two squares of forest are wanted, but the first forest started is drawn three big: it stops at two.
  it("stops the last forest short once the ground is covered as much as it is to be", () => {
    expect(forestSquares([[GROUND, GROUND, GROUND, GROUND]], 0.5, drawing(0, 0.9, 0, 0))).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 1 },
    ]);
  });

  // With the whole map of plain ground to spread over, every square a forest takes touches another of it.
  it("grows a forest of squares each touching another of it", () => {
    const forest = forestSquares(allGround(5, 5), 0.12, drawing(0.5, 0.9, 0.99, 0.99));

    expect(forest.filter(square => !forest.some(otherSquare =>
      Math.abs(square.x - otherSquare.x) + Math.abs(square.y - otherSquare.y) === 1))).toEqual([]);
  });
});

describe("drawForestShare", () => {
  const FOREST = { isOnLand: true, isDesert: false, isForest: true };
  const GRASSLAND = { isOnLand: true, isDesert: false, isForest: false };
  const SEA_AREA = { isOnLand: false, isDesert: false, isForest: false };
  const DESERT = { isOnLand: true, isDesert: true, isForest: false };

  // A forest is mostly forest, grassland has little of it, the sea less still and the desert none.
  it("draws 50%-90% for a forest, 0%-15% for grassland, 0%-10% for the sea and nothing for the desert", () => {
    const sharesBetween = (ground: typeof FOREST) => [drawForestShare(ground, () => 0), drawForestShare(ground, () => 1)];

    expect({
      forest: sharesBetween(FOREST),
      grassland: sharesBetween(GRASSLAND),
      sea: sharesBetween(SEA_AREA),
      desert: sharesBetween(DESERT),
    }).toEqual({
      forest: [0.5, 0.9],
      grassland: [0, 0.15],
      sea: [0, 0.1],
      desert: [0, 0],
    });
  });
});
