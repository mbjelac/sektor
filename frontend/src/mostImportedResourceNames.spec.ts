import { describe, it, expect } from "vitest";
import { ImportsAndExports, mostImportedResourceNames } from "./globalImportsAndExports";

function moving(imports: [string, number][], exports: [string, number][]): ImportsAndExports {
  return {
    imports: imports.map(([name, value]) => ({ name, value })),
    exports: exports.map(([name, value]) => ({ name, value })),
  };
}

describe("mostImportedResourceNames", () => {
  it("names what the planet is shortest of first", () => {
    const planet = moving([["Water", 2], ["Food", 9], ["Ore", 5]], []);

    expect(mostImportedResourceNames(planet, 3)).toEqual(["Food", "Ore", "Water"]);
  });

  it("names no more resources than it is asked for", () => {
    const planet = moving([["Water", 2], ["Food", 9], ["Ore", 5], ["Stone", 7]], []);

    expect(mostImportedResourceNames(planet, 3)).toEqual(["Food", "Stone", "Ore"]);
  });

  it("names every resource there is when the planet is short of fewer than it is asked for", () => {
    expect(mostImportedResourceNames(moving([["Water", 2]], []), 3)).toEqual(["Water"]);
  });

  it("names nothing while the planet is short of nothing", () => {
    expect(mostImportedResourceNames(moving([], [["Water", 9]]), 3)).toEqual([]);
  });

  it("leaves out what the planet sends out", () => {
    const planet = moving([["Water", 2]], [["Food", 9]]);

    expect(mostImportedResourceNames(planet, 3)).toEqual(["Water"]);
  });

  // The resources come in the order of their names, so ones the planet is equally short of stay in
  // it rather than being shuffled about by the ordering.
  it("keeps resources the planet is equally short of in the order of their names", () => {
    const planet = moving([["Food", 4], ["Ore", 4], ["Water", 4]], []);

    expect(mostImportedResourceNames(planet, 3)).toEqual(["Food", "Ore", "Water"]);
  });
});
