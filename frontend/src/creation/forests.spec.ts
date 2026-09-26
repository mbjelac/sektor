import { describe, it, expect } from "vitest";
import { plantForests } from "./forests";
import { ELEVATION, GROUND, SEA } from "../../../shared/terrain";

// The draws fall in the order given, the last of them over and over once the others are used up.
function drawing(...values: number[]): () => number {
  let drawIndex = 0;
  return () => values[Math.min(drawIndex++, values.length - 1)];
}

function allGround(width: number, height: number): number[][] {
  return Array.from({ length: width }, () => Array.from({ length: height }, () => GROUND));
}

// The terrain is read column first: terrain[x][y]. A draw below 0.1 starts a forest of three
// squares, below 0.2 one of two squares, below 0.3 one of a single square, and any other none.
describe("plantForests", () => {
  it("plants no forest where no draw falls within a chance", () => {
    expect(plantForests(allGround(5, 5), drawing(0.5))).toEqual([]);
  });

  it("starts a forest on every square of plain ground its draw falls within a chance for", () => {
    const terrain = [
      [GROUND, SEA],
      [ELEVATION, GROUND],
    ];

    expect(plantForests(terrain, drawing(0.25))).toEqual([
      { type: "Forest", location: { x: 0, y: 0 } },
      { type: "Forest", location: { x: 1, y: 1 } },
    ]);
  });

  // The first square starts a forest of three squares, which spreads along the only ground there is.
  it("spreads a forest bigger than one square onto the ground around where it starts", () => {
    expect(plantForests([[GROUND, GROUND, GROUND]], drawing(0.05, 0, 0, 0.5))).toEqual([
      { type: "Forest", location: { x: 0, y: 0 } },
      { type: "Forest", location: { x: 0, y: 1 } },
      { type: "Forest", location: { x: 0, y: 2 } },
    ]);
  });

  // The first square starts a forest of two squares, but the only other plain ground meets it at a
  // corner, and draws no forest of its own.
  it("spreads a forest only onto squares sharing a side with it", () => {
    const terrain = [
      [GROUND, SEA],
      [SEA, GROUND],
    ];

    expect(plantForests(terrain, drawing(0.15, 0.5))).toEqual([
      { type: "Forest", location: { x: 0, y: 0 } },
    ]);
  });

  // The first square starts a forest of two squares, which spreads onto the second. Were the second
  // square drawn for too, it would start a forest of its own there.
  it("draws nothing for a square a forest has already spread onto", () => {
    expect(plantForests([[GROUND, GROUND]], drawing(0.15, 0, 0.25))).toEqual([
      { type: "Forest", location: { x: 0, y: 0 } },
      { type: "Forest", location: { x: 0, y: 1 } },
    ]);
  });

  // The first square starts a forest of three squares with the whole map of plain ground to spread
  // over, and still every square it takes touches another of it.
  it("grows a forest of squares each touching another of it", () => {
    const forest = plantForests(allGround(5, 5), drawing(0.05, 0.99, 0.99, 0.5))
      .map(building => building.location);

    expect(forest.filter(square => !forest.some(otherSquare =>
      Math.abs(square.x - otherSquare.x) + Math.abs(square.y - otherSquare.y) === 1))).toEqual([]);
  });
});
