import { describe, it, expect } from "vitest";
import { ImportsAndExports, mostImportedScarceResourceNames } from "./globalImportsAndExports";

function moving(imports: [string, number][], exports: [string, number][]): ImportsAndExports {
  return {
    imports: imports.map(([name, value]) => ({ name, value })),
    exports: exports.map(([name, value]) => ({ name, value })),
  };
}

describe("mostImportedScarceResourceNames", () => {
  it("names what the sektor brings most of in first", () => {
    const sektor = moving([["Water", 2], ["Food", 9], ["Ore", 5]], []);
    const planet = moving([["Water", 1], ["Food", 1], ["Ore", 1]], []);

    expect(mostImportedScarceResourceNames(sektor, planet, 3)).toEqual(["Food", "Ore", "Water"]);
  });

  // The sektor is ordered by what it brings in, not by what the planet is shortest of: the player
  // is being told what to leave off here.
  it("names them in the sektor's order rather than the planet's", () => {
    const sektor = moving([["Water", 9], ["Food", 2]], []);
    const planet = moving([["Water", 1], ["Food", 50]], []);

    expect(mostImportedScarceResourceNames(sektor, planet, 3)).toEqual(["Water", "Food"]);
  });

  it("leaves out what the sektor brings in which the planet has over", () => {
    const sektor = moving([["Water", 9], ["Food", 2]], []);
    const planet = moving([["Food", 4]], [["Water", 30]]);

    expect(mostImportedScarceResourceNames(sektor, planet, 3)).toEqual(["Food"]);
  });

  it("leaves out what the sektor brings in which the planet neither is short of nor has over", () => {
    const sektor = moving([["Water", 9]], []);

    expect(mostImportedScarceResourceNames(sektor, moving([], []), 3)).toEqual([]);
  });

  it("names no more resources than it is asked for", () => {
    const sektor = moving([["Water", 2], ["Food", 9], ["Ore", 5], ["Stone", 7]], []);
    const planet = moving([["Water", 1], ["Food", 1], ["Ore", 1], ["Stone", 1]], []);

    expect(mostImportedScarceResourceNames(sektor, planet, 3)).toEqual(["Food", "Stone", "Ore"]);
  });

  it("names nothing while the sektor brings nothing in", () => {
    const sektor = moving([], [["Water", 9]]);

    expect(mostImportedScarceResourceNames(sektor, moving([["Water", 4]], []), 3)).toEqual([]);
  });
});
