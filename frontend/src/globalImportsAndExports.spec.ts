import { describe, it, expect } from "vitest";
import { globalImportsAndExports, ImportsAndExports } from "./globalImportsAndExports";

function sektorMoving(imports: [string, number][], exports: [string, number][]): ImportsAndExports {
  return {
    imports: imports.map(([name, value]) => ({ name, value })),
    exports: exports.map(([name, value]) => ({ name, value })),
  };
}

describe("globalImportsAndExports", () => {
  // What one sektor sends out covers what another brings in, so the planet is left with the
  // difference: of the ten Water sent out nine are taken, and of the fifteen Food brought in
  // eight are covered.
  it("sets what the sektors send out against what they bring in", () => {
    expect(globalImportsAndExports([
      sektorMoving([["Food", 15]], [["Water", 10]]),
      sektorMoving([["Water", 9]], [["Food", 8]]),
    ])).toEqual({
      imports: [{ name: "Food", value: 7 }],
      exports: [{ name: "Water", value: 1 }],
    });
  });

  it("adds up what every sektor brings in of the same resource", () => {
    expect(globalImportsAndExports([
      sektorMoving([["Food", 3]], []),
      sektorMoving([["Food", 4]], []),
    ])).toEqual({
      imports: [{ name: "Food", value: 7 }],
      exports: [],
    });
  });

  it("leaves out a resource the sektors send out as much of as they bring in", () => {
    expect(globalImportsAndExports([
      sektorMoving([], [["Water", 6]]),
      sektorMoving([["Water", 6]], []),
    ])).toEqual({ imports: [], exports: [] });
  });

  // A sektor names a resource it neither brings in nor sends out at nothing, which adds nothing to
  // the planet and so puts the resource nowhere.
  it("leaves out a resource no sektor moves", () => {
    expect(globalImportsAndExports([sektorMoving([["Water", 0]], [["Water", 0]])]))
      .toEqual({ imports: [], exports: [] });
  });

  it("moves nothing when there is no sektor", () => {
    expect(globalImportsAndExports([])).toEqual({ imports: [], exports: [] });
  });

  it("names every resource it lists in alphabetical order", () => {
    expect(globalImportsAndExports([
      sektorMoving([["Water", 1], ["Food", 2], ["Ore", 3]], [["Steel", 1], ["Coal", 2]]),
    ])).toEqual({
      imports: [{ name: "Food", value: 2 }, { name: "Ore", value: 3 }, { name: "Water", value: 1 }],
      exports: [{ name: "Coal", value: 2 }, { name: "Steel", value: 1 }],
    });
  });

  // Amounts written with a single decimal place add up to amounts with a single decimal place,
  // rather than to the floating point noise the adding of them leaves behind.
  it("adds up amounts written with a decimal place", () => {
    expect(globalImportsAndExports([
      sektorMoving([["Food", 0.1]], []),
      sektorMoving([["Food", 0.2]], []),
    ])).toEqual({
      imports: [{ name: "Food", value: 0.3 }],
      exports: [],
    });
  });
});
