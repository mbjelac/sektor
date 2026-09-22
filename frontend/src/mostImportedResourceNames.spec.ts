import { describe, it, expect } from "vitest";
import { ImportsAndExports, mostImportedResourceNames } from "./globalImportsAndExports";

const NOTHING_DOES_HARM: string[] = [];

function moving(imports: [string, number][], exports: [string, number][]): ImportsAndExports {
  return {
    imports: imports.map(([name, value]) => ({ name, value })),
    exports: exports.map(([name, value]) => ({ name, value })),
  };
}

describe("mostImportedResourceNames", () => {
  it("names what the planet is shortest of first", () => {
    const planet = moving([["Water", 2], ["Food", 9], ["Ore", 5]], []);

    expect(mostImportedResourceNames(planet, NOTHING_DOES_HARM, 3)).toEqual(["Food", "Ore", "Water"]);
  });

  it("names no more resources than it is asked for", () => {
    const planet = moving([["Water", 2], ["Food", 9], ["Ore", 5], ["Stone", 7]], []);

    expect(mostImportedResourceNames(planet, NOTHING_DOES_HARM, 3)).toEqual(["Food", "Stone", "Ore"]);
  });

  it("names every resource there is when the planet is short of fewer than it is asked for", () => {
    expect(mostImportedResourceNames(moving([["Water", 2]], []), NOTHING_DOES_HARM, 3)).toEqual(["Water"]);
  });

  it("names nothing while the planet is short of nothing", () => {
    expect(mostImportedResourceNames(moving([], [["Water", 9]]), NOTHING_DOES_HARM, 3)).toEqual([]);
  });

  it("leaves out what the planet sends out", () => {
    const planet = moving([["Water", 2]], [["Food", 9]]);

    expect(mostImportedResourceNames(planet, NOTHING_DOES_HARM, 3)).toEqual(["Water"]);
  });

  // The resources come in the order of their names, so ones the planet is equally short of stay in
  // it rather than being shuffled about by the ordering.
  it("keeps resources the planet is equally short of in the order of their names", () => {
    const planet = moving([["Food", 4], ["Ore", 4], ["Water", 4]], []);

    expect(mostImportedResourceNames(planet, NOTHING_DOES_HARM, 3)).toEqual(["Food", "Ore", "Water"]);
  });
});

// A resource which does harm is left out of what the planet is said to need: taking in more of it
// than is given off is a job being done, not a shortage, and nobody is to be told to make more.
describe("mostImportedResourceNames of a planet taking in what does harm", () => {
  it("leaves out a resource which does harm", () => {
    const planet = moving([["Waste", 90], ["Water", 2]], []);

    expect(mostImportedResourceNames(planet, ["Waste"], 3)).toEqual(["Water"]);
  });

  it("names nothing while the only resource the planet takes in does harm", () => {
    expect(mostImportedResourceNames(moving([["Waste", 90]], []), ["Waste"], 3)).toEqual([]);
  });
});
