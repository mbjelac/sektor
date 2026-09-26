import { describe, it, expect } from "vitest";
import { plantForests } from "./forests";
import { ELEVATION, GROUND, SEA } from "../../../shared/terrain";

// Every draw falls one way, so either every square that can hold a forest does, or none of them.
function alwaysDrawing(value: number): () => number {
  return () => value;
}

describe("plantForests", () => {
  // The terrain is read column first: terrain[x][y].
  it("plants a forest on every square of plain ground its draw falls within the chance for", () => {
    const terrain = [
      [GROUND, SEA],
      [ELEVATION, GROUND],
    ];

    expect(plantForests(terrain, alwaysDrawing(0.05))).toEqual([
      { type: "Forest", location: { x: 0, y: 0 } },
      { type: "Forest", location: { x: 1, y: 1 } },
    ]);
  });

  it("plants no forest where the draw falls outside the chance", () => {
    const terrain = [[GROUND, GROUND]];

    expect(plantForests(terrain, alwaysDrawing(0.1))).toEqual([]);
  });
});
